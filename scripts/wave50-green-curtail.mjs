import { readFileSync, writeFileSync } from 'node:fs';

const p = '/workspace/server/greenpulse.js';
let t = readFileSync(p, 'utf8');

const oldSummary = `    summary: {
      score,
      alerts: meters.filter((m) => m.status === 'alert').length,
      watch: meters.filter((m) => m.status === 'watch').length,
      forest_ha: meters.find((m) => m.kind === 'forest')?.value ?? 0,
      solar_kwh: meters.find((m) => m.kind === 'solar')?.value ?? 0,
      water_m3: meters.find((m) => m.kind === 'water')?.value ?? 0,
      permits_pending: pending.length,
      permits_active: active.length,
    },`;

const newSummary = `    summary: {
      score,
      alerts: meters.filter((m) => m.status === 'alert').length,
      watch: meters.filter((m) => m.status === 'watch').length,
      forest_ha: meters.find((m) => m.kind === 'forest')?.value ?? 0,
      solar_kwh: meters.find((m) => m.kind === 'solar')?.value ?? 0,
      water_m3: meters.find((m) => m.kind === 'water')?.value ?? 0,
      permits_pending: pending.length,
      permits_active: active.length,
      permits_expired: permitList.filter((p) => p.status === 'expired').length,
      curtailments_active: (readCollection('green-curtailments', []) || []).filter((c) => c.status === 'active')
        .length,
    },`;

if (t.includes(oldSummary)) {
  t = t.replace(oldSummary, newSummary);
  console.log('summary');
} else if (!t.includes('curtailments_active')) {
  console.error('SUMMARY_MISS');
  process.exit(1);
}

if (t.includes('export function runGreenPermitExpirySweep')) {
  console.log('apis already');
} else {
  t =
    t.trimEnd() +
    `
/** Süresi dolan çalışma izinlerini expire et */
export function runGreenPermitExpirySweep(input = {}, actor = 'system') {
  const list = readCollection('green-work-permits', []) || [];
  if (!Array.isArray(list) || !list.length) {
    return { ok: true, expired: [], sweep: { id: rid('gpes'), expired: 0, at: new Date().toISOString(), actor }, overview: greenPulseOverview() };
  }
  const now = Date.now();
  const expired = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (p.status !== 'approved' && p.status !== 'pending') continue;
    const exp = p.expires_at ? new Date(p.expires_at).getTime() : 0;
    if (!input.force && (!exp || exp > now)) continue;
    list[i] = {
      ...p,
      status: 'expired',
      expired_at: new Date().toISOString(),
      expired_by: actor,
      expire_reason: input.force && (!exp || exp > now) ? 'force_sweep' : 'expires_at_passed',
    };
    expired.push(list[i]);
    enqueueAgentJob(
      {
        agent: 'GAIA-ESG',
        title: \`permit expired · \${p.zone_name || p.zone_id} · \${p.work}\`,
        priority: p.protected ? 'high' : 'normal',
        payload: { permit_id: p.id },
      },
      actor,
    );
  }
  if (expired.length) writeCollection('green-work-permits', list);
  const sweep = {
    id: rid('gpes'),
    expired: expired.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-permit-expiry-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'green.permit_expiry_sweep',
    detail: \`\${expired.length} expired\`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, expired, overview: greenPulseOverview() };
}

/** Enerji / su kısıtı (curtailment) — load shed */
export function issueGreenCurtailment(input = {}, actor = 'system') {
  const meters = ensureMeters();
  const kind = (input.kind || input.meter_kind || 'grid').toLowerCase();
  const meter = meters.find((m) => m.id === input.meter_id || m.kind === kind) || meters.find((m) => m.kind === 'grid');
  if (!meter) return { ok: false, error: 'Sayaç yok' };
  const pct = Math.min(80, Math.max(5, Number(input.pct) || 20));
  const hours = Math.max(1, Number(input.hours) || 4);
  const active = (readCollection('green-curtailments', []) || []).filter(
    (c) => c.status === 'active' && c.meter_id === meter.id,
  );
  if (active.length && !input.force) {
    return { ok: false, error: 'Aktif kısıt var', curtailment: active[0] };
  }
  const curtailment = {
    id: rid('gcur'),
    meter_id: meter.id,
    meter_kind: meter.kind,
    zone_id: input.zone_id || (meter.kind === 'water' ? 'z_water' : 'z_energy'),
    pct,
    reason: String(input.reason || 'peak_shed').slice(0, 240),
    status: 'active',
    until: new Date(Date.now() + hours * 3600_000).toISOString(),
    baseline_value: meter.value,
    baseline_target: meter.target,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-curtailments', curtailment, 200);
  const idx = meters.findIndex((m) => m.id === meter.id);
  if (idx >= 0) {
    const reduced =
      meter.kind === 'solar' || meter.kind === 'forest' || meter.kind === 'waste'
        ? Math.round(meter.value * (1 - pct / 100) * 10) / 10
        : Math.round(meter.value * (1 - pct / 100) * 10) / 10;
    meters[idx] = {
      ...meters[idx],
      value: reduced,
      status: pct >= 30 ? 'alert' : 'watch',
      curtailment_id: curtailment.id,
      curtailed_pct: pct,
      at: new Date().toISOString(),
    };
    writeCollection('green-meters', meters);
  }
  addCampusIncident(
    {
      title: \`Kısıt · \${meter.label} %\${pct}\`,
      zone_id: curtailment.zone_id,
      severity: pct >= 40 ? 'high' : 'info',
    },
    actor,
  );
  enqueueAgentJob(
    {
      agent: 'GAIA-ESG',
      title: \`curtailment · \${meter.kind} %\${pct} · \${hours}s\`,
      priority: pct >= 40 ? 'high' : 'normal',
      payload: { curtailment_id: curtailment.id, meter_id: meter.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'green.curtailment',
    detail: \`\${meter.kind} %\${pct}\`,
    meta: { id: curtailment.id },
  });
  return { ok: true, curtailment, meter: meters[idx] || meter, overview: greenPulseOverview() };
}

/** Aktif kısıtı kaldır — baseline’a yakın restore */
export function clearGreenCurtailment(input = {}, actor = 'system') {
  const list = readCollection('green-curtailments', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Kısıt yok' };
  let idx = list.findIndex((c) => c.id === input.id && c.status === 'active');
  if (idx < 0) {
    idx = list.findIndex(
      (c) =>
        c.status === 'active' &&
        (!input.meter_id || c.meter_id === input.meter_id) &&
        (!input.kind || c.meter_kind === input.kind),
    );
  }
  if (idx < 0) return { ok: false, error: 'Aktif kısıt yok' };
  const cur = list[idx];
  list[idx] = {
    ...cur,
    status: 'cleared',
    cleared_at: new Date().toISOString(),
    cleared_by: actor,
    clear_note: String(input.note || 'restored').slice(0, 240),
  };
  writeCollection('green-curtailments', list);
  const meters = ensureMeters();
  const midx = meters.findIndex((m) => m.id === cur.meter_id);
  if (midx >= 0) {
    const restored = Number(cur.baseline_value);
    meters[midx] = {
      ...meters[midx],
      value: Number.isFinite(restored) ? restored : meters[midx].value,
      status: 'ok',
      curtailment_id: null,
      curtailed_pct: 0,
      at: new Date().toISOString(),
    };
    writeCollection('green-meters', meters);
  }
  const clearout = {
    id: rid('gclr'),
    curtailment_id: cur.id,
    meter_id: cur.meter_id,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-curtailment-clears', clearout, 120);
  enqueueAgentJob(
    {
      agent: 'GAIA-ESG',
      title: \`curtailment clear · \${cur.meter_kind}\`,
      priority: 'normal',
      payload: { curtailment_id: cur.id, clearout_id: clearout.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'green.curtailment_clear',
    detail: cur.meter_kind,
    meta: { id: clearout.id, curtailment_id: cur.id },
  });
  return { ok: true, curtailment: list[idx], clearout, overview: greenPulseOverview() };
}
`;
  console.log('apis');
}

writeFileSync(p, t);
console.log('WAVE50_GREEN_OK');
