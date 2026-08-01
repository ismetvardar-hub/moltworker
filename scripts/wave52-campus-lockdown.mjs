import { readFileSync, writeFileSync } from 'node:fs';

const p = '/workspace/server/campuscore.js';
let t = readFileSync(p, 'utf8');

const oldSummary = `    summary: {
      total_ha: zones.reduce((s, z) => s + (Number(z.hectares) || 0), 0),
      active: zones.filter((z) => z.status === 'active').length,
      build: zones.filter((z) => z.status === 'build').length,
      protected: zones.filter((z) => z.status === 'protected').length,
      open_incidents: openInc.length,
      open_work_orders: openWo.length,
      assigned_work_orders: woList.filter((w) => w.status === 'assigned').length,
      in_progress_work_orders: woList.filter((w) => w.status === 'in_progress').length,
      escalated_work_orders: woList.filter((w) => w.escalated).length,
      byKind,
    },`;

const newSummary = `    summary: {
      total_ha: zones.reduce((s, z) => s + (Number(z.hectares) || 0), 0),
      active: zones.filter((z) => z.status === 'active').length,
      build: zones.filter((z) => z.status === 'build').length,
      protected: zones.filter((z) => z.status === 'protected').length,
      open_incidents: openInc.length,
      open_work_orders: openWo.length,
      assigned_work_orders: woList.filter((w) => w.status === 'assigned').length,
      in_progress_work_orders: woList.filter((w) => w.status === 'in_progress').length,
      escalated_work_orders: woList.filter((w) => w.escalated).length,
      locked_zones: zones.filter((z) => z.lockdown).length,
      escalated_incidents: (Array.isArray(incidents) ? incidents : []).filter((i) => i.escalated && (i.status || 'open') === 'open').length,
      capacity_alerts: (readCollection('campus-capacity-alerts', []) || []).filter((a) => a.status === 'open').length,
      byKind,
    },`;

if (t.includes(oldSummary)) {
  t = t.replace(oldSummary, newSummary);
  console.log('summary');
} else if (!t.includes('locked_zones')) {
  console.error('SUMMARY_MISS');
  process.exit(1);
}

if (t.includes('export function escalateCampusIncident')) {
  console.log('apis already');
} else {
  t =
    t.trimEnd() +
    `
/** Incident escalate — severity yükselt + WO + ajan */
export function escalateCampusIncident(input = {}, actor = 'system') {
  const list = readCollection('campus-incidents', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Incident yok' };
  let idx = list.findIndex((r) => r.id === input.id && (r.status || 'open') === 'open');
  if (idx < 0) idx = list.findIndex((r) => (r.status || 'open') === 'open');
  if (idx < 0) return { ok: false, error: 'Açık incident yok' };
  const cur = list[idx];
  const ladder = ['info', 'watch', 'high', 'critical'];
  const from = ladder.includes(cur.severity) ? cur.severity : 'info';
  let to = input.severity;
  if (!to) {
    const i = ladder.indexOf(from);
    to = ladder[Math.min(ladder.length - 1, i + 1)];
  }
  if (!ladder.includes(to)) to = 'high';
  list[idx] = {
    ...cur,
    severity: to,
    escalated: true,
    escalated_at: new Date().toISOString(),
    escalated_by: actor,
    escalate_reason: String(input.reason || 'ops_escalate').slice(0, 240),
  };
  writeCollection('campus-incidents', list);
  const esc = {
    id: rid('cies'),
    incident_id: list[idx].id,
    from_severity: from,
    to_severity: to,
    reason: list[idx].escalate_reason,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-incident-escalations', esc, 120);
  const zones = ensureZones();
  const zone = zones.find((z) => z.id === list[idx].zone_id);
  enqueueAgentJob(
    {
      agent: agentForZone(zone?.kind),
      title: \`incident escalate · \${list[idx].title} · \${to}\`,
      priority: to === 'critical' || to === 'high' ? 'high' : 'normal',
      payload: { incident_id: list[idx].id, escalation_id: esc.id },
    },
    actor,
  );
  let work_order = null;
  if (input.create_wo !== false) {
    const wo = createCampusWorkOrder(
      {
        zone_id: list[idx].zone_id,
        title: \`Escalation · \${list[idx].title}\`,
        priority: to === 'critical' ? 'high' : 'normal',
        incident_id: list[idx].id,
        kind: 'incident_response',
      },
      actor,
    );
    if (wo.ok) work_order = wo.work_order;
  }
  appendAudit({
    actor,
    action: 'campus.incident_escalate',
    detail: \`\${list[idx].title} · \${from}→\${to}\`,
    meta: { id: esc.id, incident_id: list[idx].id },
  });
  return { ok: true, incident: list[idx], escalation: esc, work_order, overview: campusCoreOverview() };
}

/** Zon lockdown — misafir girişi / saha durdur */
export function lockdownCampusZone(input = {}, actor = 'system') {
  const list = ensureZones();
  const idx = list.findIndex((z) => z.id === input.zone_id || z.name === input.zone_id);
  if (idx < 0) return { ok: false, error: 'Zon yok' };
  if (list[idx].lockdown && !input.force) {
    return { ok: false, error: 'Zaten lockdown', zone: list[idx] };
  }
  const prevStatus = list[idx].status;
  list[idx] = {
    ...list[idx],
    lockdown: true,
    lockdown_reason: String(input.reason || 'safety').slice(0, 240),
    lockdown_at: new Date().toISOString(),
    lockdown_by: actor,
    status_before_lockdown: prevStatus,
    status: list[idx].kind === 'green' ? 'protected' : list[idx].status,
  };
  writeCollection('campus-zones', list);
  const lock = {
    id: rid('clk'),
    zone_id: list[idx].id,
    zone_name: list[idx].name,
    reason: list[idx].lockdown_reason,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-zone-lockdowns', lock, 120);
  addCampusIncident(
    {
      title: \`Lockdown · \${list[idx].name}\`,
      zone_id: list[idx].id,
      severity: input.severity || 'high',
    },
    actor,
  );
  enqueueAgentJob(
    {
      agent: agentForZone(list[idx].kind),
      title: \`zone lockdown · \${list[idx].name}\`,
      priority: 'high',
      payload: { lockdown_id: lock.id, zone_id: list[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'campus.zone_lockdown',
    detail: list[idx].name,
    meta: { id: lock.id },
  });
  return { ok: true, zone: list[idx], lockdown: lock, overview: campusCoreOverview() };
}

/** Lockdown kaldır */
export function clearCampusZoneLockdown(input = {}, actor = 'system') {
  const list = ensureZones();
  let idx = list.findIndex((z) => (z.id === input.zone_id || z.name === input.zone_id) && z.lockdown);
  if (idx < 0) idx = list.findIndex((z) => z.lockdown);
  if (idx < 0) return { ok: false, error: 'Lockdown yok' };
  const restore = input.status || list[idx].status_before_lockdown || list[idx].status;
  list[idx] = {
    ...list[idx],
    lockdown: false,
    lockdown_cleared_at: new Date().toISOString(),
    lockdown_cleared_by: actor,
    lockdown_clear_note: String(input.note || 'cleared').slice(0, 240),
    status: restore,
  };
  writeCollection('campus-zones', list);
  const clearout = {
    id: rid('clrc'),
    zone_id: list[idx].id,
    zone_name: list[idx].name,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-zone-lockdown-clears', clearout, 80);
  appendAudit({
    actor,
    action: 'campus.zone_lockdown_clear',
    detail: list[idx].name,
    meta: { id: clearout.id },
  });
  return { ok: true, zone: list[idx], clearout, overview: campusCoreOverview() };
}

/** Kapasite eşiği aşıldığında alert + opsiyonel lockdown */
export function runCampusCapacityAlertSweep(input = {}, actor = 'system') {
  const roll = campusCapacityRollup(actor);
  const pct = Number(roll.rollup?.stay_occ_pct) || 0;
  const threshold = Number(input.threshold) || 85;
  const alerts = [];
  if (pct >= threshold || input.force) {
    const alert = {
      id: rid('cca'),
      stay_occ_pct: pct,
      threshold,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    prependItem('campus-capacity-alerts', alert, 120);
    alerts.push(alert);
    addCampusIncident(
      {
        title: \`Kapasite alert · stay %\${pct}\`,
        zone_id: input.zone_id || 'z_glamp',
        severity: pct >= 95 ? 'critical' : 'high',
      },
      actor,
    );
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: \`capacity alert · stay %\${pct}\`,
        priority: 'high',
        payload: { alert_id: alert.id, stay_occ_pct: pct },
      },
      actor,
    );
    if (input.lockdown || pct >= 98) {
      lockdownCampusZone(
        { zone_id: input.zone_id || 'z_glamp', reason: 'capacity_saturation', force: true },
        actor,
      );
    }
  }
  const sweep = {
    id: rid('ccas'),
    alerts: alerts.length,
    stay_occ_pct: pct,
    threshold,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-capacity-alert-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'campus.capacity_alert_sweep',
    detail: \`\${alerts.length} alert · %\${pct}\`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, alerts, rollup: roll.rollup, overview: campusCoreOverview() };
}
`;
  console.log('apis');
}

writeFileSync(p, t);
console.log('WAVE52_CAMPUS_OK');
