/**
 * Yeşil & Arazi — ESG nabız: orman, su, enerji, karbon.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { addCampusIncident, campusCoreOverview } from './campuscore.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureMeters() {
  let list = readCollection('green-meters', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'gm_forest', kind: 'forest', label: 'Orman koruma', unit: 'ha', value: 18, target: 18, status: 'ok' },
      { id: 'gm_water', kind: 'water', label: 'Su kullanımı', unit: 'm3/gün', value: 42, target: 55, status: 'ok' },
      { id: 'gm_solar', kind: 'solar', label: 'Güneş üretimi', unit: 'kWh/gün', value: 860, target: 900, status: 'watch' },
      { id: 'gm_grid', kind: 'grid', label: 'Şebeke çekiş', unit: 'kWh/gün', value: 410, target: 350, status: 'alert' },
      { id: 'gm_waste', kind: 'waste', label: 'Atık ayrıştırma', unit: '%', value: 78, target: 85, status: 'watch' },
      { id: 'gm_co2', kind: 'carbon', label: 'Karbon yoğunluk', unit: 'kg/misafir', value: 3.2, target: 2.8, status: 'alert' },
    ];
    writeCollection('green-meters', list);
  }
  return list;
}

function scoreOf(meters) {
  let ok = 0;
  for (const m of meters) {
    if (m.kind === 'forest' || m.kind === 'solar' || m.kind === 'waste') {
      if (m.value >= m.target * 0.95) ok++;
    } else if (m.value <= m.target * 1.05) ok++;
  }
  return Math.round((ok / Math.max(1, meters.length)) * 100);
}

export function greenPulseOverview() {
  const meters = ensureMeters();
  const campus = campusCoreOverview();
  const incidents = readCollection('green-incidents', []) || [];
  const score = scoreOf(meters);
  const permits = readCollection('green-work-permits', []) || [];
  const permitList = Array.isArray(permits) ? permits : [];
  const pending = permitList.filter((p) => p.status === 'pending');
  const active = permitList.filter((p) => p.status === 'approved');
  return {
    title: 'Yeşil & Arazi ESG',
    ethos: 'Orman önce — ciro ormanın gölgesinde büyür.',
    meters,
    campus_zones: campus.zones?.filter((z) => z.kind === 'green' || z.kind === 'water') || [],
    incidents: (Array.isArray(incidents) ? incidents : []).slice(0, 20),
    permits: permitList.slice(0, 30),
    summary: {
      score,
      alerts: meters.filter((m) => m.status === 'alert').length,
      watch: meters.filter((m) => m.status === 'watch').length,
      forest_ha: meters.find((m) => m.kind === 'forest')?.value ?? 0,
      solar_kwh: meters.find((m) => m.kind === 'solar')?.value ?? 0,
      water_m3: meters.find((m) => m.kind === 'water')?.value ?? 0,
      permits_pending: pending.length,
      permits_active: active.length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function recordGreenMeter(input = {}, actor = 'system') {
  const meters = ensureMeters();
  const idx = meters.findIndex((m) => m.id === input.id || m.kind === input.kind);
  if (idx < 0) return { ok: false, error: 'Sayaç yok' };
  const m = meters[idx];
  const value = Number(input.value);
  if (Number.isNaN(value)) return { ok: false, error: 'value gerekli' };
  let status = 'ok';
  if (m.kind === 'forest' || m.kind === 'solar' || m.kind === 'waste') {
    if (value < m.target * 0.9) status = 'alert';
    else if (value < m.target * 0.95) status = 'watch';
  } else {
    if (value > m.target * 1.15) status = 'alert';
    else if (value > m.target * 1.05) status = 'watch';
  }
  meters[idx] = { ...m, value, status, at: new Date().toISOString(), actor };
  writeCollection('green-meters', meters);
  prependItem(
    'green-readings',
    { id: rid('gr'), meter_id: m.id, value, status, at: new Date().toISOString() },
    400,
  );
  if (status === 'alert') {
    enqueueAgentJob(
      {
        agent: 'GAIA-ESG',
        title: `ESG alert · ${m.kind}=${value} (hedef ${m.target})`,
        priority: 'high',
        payload: { meter_id: m.id, value, target: m.target },
      },
      actor,
    );
  }
  appendAudit({ actor, action: 'green.meter', detail: `${m.kind}=${value}`, meta: { id: m.id } });
  return { ok: true, meter: meters[idx], overview: greenPulseOverview() };
}

/** Birden fazla sayaç tek turda */
export function batchRecordGreenMeters(input = {}, actor = 'system') {
  const readings = Array.isArray(input.readings) ? input.readings : [];
  const defaults = readings.length
    ? readings
    : [
        { kind: 'solar', value: 910 },
        { kind: 'water', value: 48 },
        { kind: 'grid', value: 390 },
      ];
  const results = [];
  for (const r of defaults) {
    results.push(recordGreenMeter(r, actor));
  }
  const batch = {
    id: rid('gmb'),
    n: results.length,
    alerts: results.filter((r) => r.meter?.status === 'alert').length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-batches', batch, 80);
  appendAudit({
    actor,
    action: 'green.batch',
    detail: `${batch.n} okuma · ${batch.alerts} alert`,
    meta: { id: batch.id },
  });
  return { ok: true, batch, results, overview: greenPulseOverview() };
}

export function addGreenIncident(input = {}, actor = 'system') {
  const row = {
    id: rid('gi'),
    title: input.title || 'ESG saha notu',
    severity: input.severity || 'info',
    kind: input.kind || 'forest',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-incidents', row, 200);
  appendAudit({ actor, action: 'green.incident', detail: row.title, meta: { id: row.id } });
  return { ok: true, incident: row, overview: greenPulseOverview() };
}

/** Sayaç türüne göre remediation playbook */
export function runGreenPulseAutomations(input = {}, actor = 'system') {
  const meters = ensureMeters();
  const incidents = readCollection('green-incidents', []) || [];
  const actions = [];
  const queue = readCollection('agent-jobs', []) || [];
  const hasOpen = (agent, needle) =>
    (Array.isArray(queue) ? queue : []).some(
      (j) =>
        (j.status === 'queued' || j.status === 'running') &&
        j.agent === agent &&
        String(j.title || '').includes(needle),
    );

  for (const m of meters) {
    if (m.status !== 'alert' && m.status !== 'watch' && !input.force_all) continue;
    if (m.kind === 'solar' && m.status !== 'ok') {
      if (!hasOpen('NEXUS', 'enerji')) {
        const r = enqueueAgentJob(
          {
            agent: 'NEXUS',
            title: `enerji playbook · güneş ${m.value}/${m.target}`,
            priority: m.status === 'alert' ? 'high' : 'normal',
            payload: { meter_id: m.id, kind: 'solar' },
          },
          actor,
        );
        actions.push({ type: 'solar_nexus', job: r.job?.id });
      }
    }
    if (m.kind === 'grid' && m.status !== 'ok') {
      if (!hasOpen('GAIA-ESG', 'şebeke')) {
        const r = enqueueAgentJob(
          {
            agent: 'GAIA-ESG',
            title: `şebeke playbook · çekiş ${m.value}/${m.target}`,
            priority: 'high',
            payload: { meter_id: m.id, kind: 'grid' },
          },
          actor,
        );
        actions.push({ type: 'grid_gaia', job: r.job?.id });
      }
    }
    if (m.kind === 'water' && m.status !== 'ok') {
      if (!hasOpen('HEPHAESTUS', 'su')) {
        const r = enqueueAgentJob(
          {
            agent: 'HEPHAESTUS',
            title: `su playbook · kaçak/sulama ${m.value}${m.unit}`,
            priority: m.status === 'alert' ? 'high' : 'normal',
            payload: { meter_id: m.id, kind: 'water' },
          },
          actor,
        );
        actions.push({ type: 'water_heph', job: r.job?.id });
      }
    }
    if (m.kind === 'waste' && m.status !== 'ok') {
      if (!hasOpen('DAZE-CREW', 'atık')) {
        const r = enqueueAgentJob(
          {
            agent: 'DAZE-CREW',
            title: `atık playbook · ayrıştırma %${m.value}`,
            priority: 'normal',
            payload: { meter_id: m.id, kind: 'waste' },
          },
          actor,
        );
        actions.push({ type: 'waste_crew', job: r.job?.id });
      }
    }
    if (m.kind === 'carbon' && m.status === 'alert') {
      if (!hasOpen('GAIA-ESG', 'karbon')) {
        const r = enqueueAgentJob(
          {
            agent: 'GAIA-ESG',
            title: `karbon playbook · ${m.value} kg/misafir`,
            priority: 'high',
            payload: { meter_id: m.id, kind: 'carbon' },
          },
          actor,
        );
        actions.push({ type: 'carbon_gaia', job: r.job?.id });
      }
    }
  }

  for (const inc of (Array.isArray(incidents) ? incidents : []).slice(0, 5)) {
    if (inc.severity === 'critical' || inc.severity === 'high') {
      if (!hasOpen('GAIA-ESG', 'eskalasyon')) {
        const r = enqueueAgentJob(
          {
            agent: 'GAIA-ESG',
            title: `eskalasyon · ${inc.title}`,
            priority: 'high',
            payload: { incident_id: inc.id },
          },
          actor,
        );
        actions.push({ type: 'incident_esc', job: r.job?.id, incident: inc.id });
      }
    }
  }

  const run = {
    id: rid('gpa'),
    actions_n: actions.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-automations', run, 100);
  appendAudit({
    actor,
    action: 'green.automations',
    detail: `${actions.length} playbook aksiyon`,
    meta: { n: actions.length },
  });
  return { ok: true, actions, run, overview: greenPulseOverview() };
}

/** Korunan / su bölgesi çalışma izni */
export function createGreenWorkPermit(input = {}, actor = 'system') {
  const campus = campusCoreOverview();
  const zones = campus.zones || [];
  const zone =
    zones.find((z) => z.id === input.zone_id || z.name === input.zone_id) ||
    zones.find((z) => z.kind === 'green' || z.kind === 'water' || z.status === 'protected') ||
    zones[0];
  if (!zone) return { ok: false, error: 'Zone yok' };
  const protectedZone =
    zone.status === 'protected' || zone.kind === 'green' || zone.kind === 'water' || zone.kind === 'forest';
  const status = input.status || (protectedZone ? 'pending' : 'approved');
  const hours = Number(input.hours) || 8;
  const permit = {
    id: rid('gwp'),
    zone_id: zone.id,
    zone_name: zone.name,
    zone_kind: zone.kind,
    work: input.work || input.title || 'Saha bakım',
    contractor: input.contractor || actor,
    status,
    protected: !!protectedZone,
    expires_at: new Date(Date.now() + hours * 3600_000).toISOString(),
    note: input.note || '',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-work-permits', permit, 300);
  enqueueAgentJob(
    {
      agent: 'GAIA-ESG',
      title: `work permit · ${zone.name} · ${permit.work} (${status})`,
      priority: protectedZone ? 'high' : 'normal',
      payload: { permit_id: permit.id, zone_id: zone.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'green.permit',
    detail: `${zone.name} · ${status}`,
    meta: { id: permit.id },
  });
  return { ok: true, permit, overview: greenPulseOverview() };
}

export function approveGreenWorkPermit(input = {}, actor = 'system') {
  const list = readCollection('green-work-permits', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İzin yok' };
  let idx = list.findIndex((p) => p.id === input.id && p.status === 'pending');
  if (idx < 0) idx = list.findIndex((p) => p.status === 'pending');
  if (idx < 0) return { ok: false, error: 'Bekleyen izin yok' };
  const decision = input.deny || input.status === 'denied' ? 'denied' : 'approved';
  list[idx] = {
    ...list[idx],
    status: decision,
    reviewer: actor,
    review_note: input.note || '',
    reviewed_at: new Date().toISOString(),
  };
  writeCollection('green-work-permits', list);
  appendAudit({
    actor,
    action: 'green.permit_review',
    detail: `${list[idx].zone_name} → ${decision}`,
    meta: { id: list[idx].id },
  });
  return { ok: true, permit: list[idx], overview: greenPulseOverview() };
}

export function closeGreenWorkPermit(input = {}, actor = 'system') {
  const list = readCollection('green-work-permits', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İzin yok' };
  let idx = list.findIndex((p) => p.id === input.id && (p.status === 'approved' || p.status === 'pending'));
  if (idx < 0) idx = list.findIndex((p) => p.status === 'approved' || p.status === 'pending');
  if (idx < 0) return { ok: false, error: 'Kapatılacak izin yok' };
  list[idx] = {
    ...list[idx],
    status: 'closed',
    outcome: input.outcome || 'completed',
    closed_at: new Date().toISOString(),
    closed_by: actor,
  };
  writeCollection('green-work-permits', list);
  appendAudit({
    actor,
    action: 'green.permit_close',
    detail: list[idx].zone_name,
    meta: { id: list[idx].id },
  });
  return { ok: true, permit: list[idx], overview: greenPulseOverview() };
}

/** Su kaçağı / anomali triage → campus incident + HEPHAESTUS */
export function runWaterLeakTriage(input = {}, actor = 'system') {
  const meters = ensureMeters();
  const water = meters.find((m) => m.kind === 'water');
  const incidents = readCollection('green-incidents', []) || [];
  const waterInc = (Array.isArray(incidents) ? incidents : []).filter(
    (i) => i.kind === 'water' || /su|kaçak|leak/i.test(String(i.title || '')),
  );
  const alert = !water || water.status === 'alert' || water.status === 'watch' || input.force;
  const actions = [];
  if (alert && water) {
    const job = enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `su triage · ${water.value}${water.unit} (${water.status})`,
        priority: water.status === 'alert' ? 'high' : 'normal',
        payload: { meter_id: water.id, value: water.value },
      },
      actor,
    );
    actions.push({ type: 'hephaestus', job_id: job?.id || job?.job?.id });
  }
  for (const inc of waterInc.slice(0, 3)) {
    const campusInc = addCampusIncident(
      {
        title: `Su triage · ${inc.title}`,
        zone_id: input.zone_id || 'z_water',
        severity: inc.severity || 'high',
      },
      actor,
    );
    actions.push({ type: 'campus_incident', id: campusInc?.id });
  }
  if (!waterInc.length && alert) {
    const campusInc = addCampusIncident(
      {
        title: `Su anomali · ${water?.value ?? '?'} m3`,
        zone_id: 'z_water',
        severity: water?.status === 'alert' ? 'high' : 'info',
      },
      actor,
    );
    actions.push({ type: 'campus_incident', id: campusInc?.id });
  }
  const triage = {
    id: rid('gwt'),
    water_status: water?.status || null,
    water_value: water?.value ?? null,
    actions: actions.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-water-triage', triage, 80);
  appendAudit({
    actor,
    action: 'green.water_triage',
    detail: `${triage.actions} aksiyon · ${triage.water_status}`,
    meta: { id: triage.id },
  });
  return { ok: true, triage, actions, overview: greenPulseOverview() };
}
