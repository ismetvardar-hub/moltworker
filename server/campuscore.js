/**
 * Adım 2 — Kampüs omurga: arazi zonları.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function agentForZone(kind) {
  if (kind === 'green' || kind === 'water') return 'GAIA-ESG';
  if (kind === 'sport') return 'HEPHAESTUS';
  if (kind === 'stay') return 'DAZE-CREW';
  if (kind === 'culture') return 'CULTURE-AI';
  if (kind === 'mall') return 'MINT';
  if (kind === 'family') return 'DAZE-CREW';
  return 'HEPHAESTUS';
}

const CAMPUS_ID = 'likya_antalya_forest_campus';

const DEFAULT_ZONES = [
  { id: 'z_sport', name: 'Spor & Extreme', kind: 'sport', hectares: 12, status: 'active', notes: 'Açık/kapalı salon, tırmanış, dere' },
  { id: 'z_water', name: 'Dere & Su Sporları', kind: 'water', hectares: 4, status: 'active', notes: 'Kürek, kano, SUP' },
  { id: 'z_glamp', name: 'Glamping / Çadır', kind: 'stay', hectares: 6, status: 'active', notes: 'Çadır + glamping' },
  { id: 'z_caravan', name: 'Karavan Kışlama', kind: 'stay', hectares: 5, status: 'build', notes: 'Kışlama + hook-up' },
  { id: 'z_bungalow', name: 'Bungalow', kind: 'stay', hectares: 7, status: 'active', notes: 'Aile bungalow' },
  { id: 'z_mall', name: 'Açık AVM', kind: 'mall', hectares: 3, status: 'active', notes: 'Market, F&B, hediyelik' },
  { id: 'z_culture', name: 'Kültür & Sahne', kind: 'culture', hectares: 2, status: 'planned', notes: 'Müzik, tiyatro' },
  { id: 'z_family', name: 'Aile & Çocuk', kind: 'family', hectares: 3, status: 'active', notes: 'Kamp, emanet, yaz okulu' },
  { id: 'z_forest', name: 'Orman Koruma', kind: 'green', hectares: 18, status: 'protected', notes: 'Dokunulmaz yeşil' },
];

function ensureZones() {
  let list = readCollection('campus-zones', null);
  if (!Array.isArray(list) || !list.length) {
    list = DEFAULT_ZONES.map((z) => ({ ...z, campus_id: CAMPUS_ID, at: new Date().toISOString() }));
    writeCollection('campus-zones', list);
  }
  return list;
}

export function campusCoreOverview() {
  const zones = ensureZones();
  const byKind = {};
  for (const z of zones) byKind[z.kind] = (byKind[z.kind] || 0) + 1;
  const incidents = readCollection('campus-incidents', []) || [];
  const openInc = (Array.isArray(incidents) ? incidents : []).filter((i) => (i.status || 'open') === 'open');
  const caps = readCollection('campus-capacity-rollups', []) || [];
  const wos = readCollection('campus-work-orders', []) || [];
  const woList = Array.isArray(wos) ? wos : [];
  const openWo = woList.filter(
    (w) => w.status === 'open' || w.status === 'assigned' || w.status === 'in_progress',
  );
  const assignments = readCollection('campus-work-order-assignments', []) || [];
  const escalations = readCollection('campus-work-order-escalations', []) || [];
  return {
    campus_id: CAMPUS_ID,
    title: 'LİKYA Orman Kampüsü',
    ethos: 'Sporla beslenen destinasyon — orman önce, ciro sonra.',
    zones,
    incidents: (Array.isArray(incidents) ? incidents : []).slice(0, 20),
    work_orders: woList.slice(0, 30),
    assignments: (Array.isArray(assignments) ? assignments : []).slice(0, 20),
    escalations: (Array.isArray(escalations) ? escalations : []).slice(0, 12),
    capacity: Array.isArray(caps) && caps[0] ? caps[0] : null,
    summary: {
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
    },
    generatedAt: new Date().toISOString(),
  };
}

export function updateCampusZone(id, patch = {}, actor = 'system') {
  const list = ensureZones();
  const idx = list.findIndex((z) => z.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('campus-zones', list);
  appendAudit({ actor, action: 'campus.zone', detail: `${id} → ${list[idx].status}`, meta: { id } });
  return list[idx];
}

export function addCampusIncident(input = {}, actor = 'system') {
  const row = {
    id: `ci_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    campus_id: CAMPUS_ID,
    zone_id: input.zone_id || 'z_sport',
    title: input.title || 'Saha notu',
    severity: input.severity || 'info',
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-incidents', row, 200);
  appendAudit({ actor, action: 'campus.incident', detail: row.title, meta: { id: row.id } });
  return row;
}

/** Zon kapasite / durum geçişi (planned→build→active) */
export function transitionCampusZone(input = {}, actor = 'system') {
  const list = ensureZones();
  const idx = list.findIndex((z) => z.id === input.zone_id || z.name === input.zone_id);
  if (idx < 0) return { ok: false, error: 'Zon yok' };
  const z = list[idx];
  const order = ['planned', 'build', 'active', 'protected'];
  let status = input.status;
  if (!status) {
    const i = order.indexOf(z.status);
    status = order[Math.min(order.length - 1, i + 1)] || 'active';
    if (z.status === 'protected') status = 'protected';
  }
  if (z.kind === 'green' && status === 'active' && !input.force) {
    status = 'protected';
  }
  list[idx] = {
    ...z,
    status,
    hectares: input.hectares != null ? Number(input.hectares) : z.hectares,
    notes: input.notes || z.notes,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('campus-zones', list);
  appendAudit({
    actor,
    action: 'campus.zone_transition',
    detail: `${list[idx].id} → ${status}`,
    meta: { id: list[idx].id },
  });
  return { ok: true, zone: list[idx], overview: campusCoreOverview() };
}

export function resolveCampusIncident(input = {}, actor = 'system') {
  const list = readCollection('campus-incidents', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Incident yok' };
  let idx = list.findIndex((r) => r.id === input.id);
  if (idx < 0) idx = list.findIndex((r) => (r.status || 'open') === 'open');
  if (idx < 0) return { ok: false, error: 'Açık incident yok' };
  list[idx] = {
    ...list[idx],
    status: 'resolved',
    resolution: input.resolution || 'kapatıldı',
    resolved_at: new Date().toISOString(),
    resolved_by: actor,
  };
  writeCollection('campus-incidents', list);
  appendAudit({
    actor,
    action: 'campus.incident_resolve',
    detail: list[idx].title,
    meta: { id: list[idx].id },
  });
  return { ok: true, incident: list[idx], overview: campusCoreOverview() };
}

/** Zon bakım / ops iş emri */
export function createCampusWorkOrder(input = {}, actor = 'system') {
  const zones = ensureZones();
  const zone =
    zones.find((z) => z.id === input.zone_id || z.name === input.zone_id) ||
    zones.find((z) => z.status === 'build') ||
    zones[0];
  if (!zone) return { ok: false, error: 'Zon yok' };
  const priority = input.priority || (input.severity === 'high' ? 'high' : 'normal');
  const wo = {
    id: rid('cwo'),
    campus_id: CAMPUS_ID,
    zone_id: zone.id,
    zone_name: zone.name,
    kind: input.kind || 'maintenance',
    title: input.title || `${zone.name} bakım`,
    priority,
    status: 'open',
    incident_id: input.incident_id || null,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-work-orders', wo, 400);
  const agent = agentForZone(zone.kind);
  enqueueAgentJob(
    {
      agent,
      title: `campus WO · ${wo.title}`,
      priority,
      payload: { work_order_id: wo.id, zone_id: zone.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'campus.work_order',
    detail: `${zone.id} · ${wo.title}`,
    meta: { id: wo.id },
  });
  return { ok: true, work_order: wo, overview: campusCoreOverview() };
}

export function completeCampusWorkOrder(input = {}, actor = 'system') {
  const list = readCollection('campus-work-orders', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İş emri yok' };
  const active = (w) =>
    w.status === 'open' || w.status === 'assigned' || w.status === 'in_progress';
  let idx = list.findIndex((w) => w.id === input.id && active(w));
  if (idx < 0) idx = list.findIndex((w) => active(w));
  if (idx < 0) return { ok: false, error: 'Açık iş emri yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    outcome: input.outcome || 'tamam',
    done_at: new Date().toISOString(),
    done_by: actor,
  };
  writeCollection('campus-work-orders', list);
  if (list[idx].incident_id) {
    resolveCampusIncident({ id: list[idx].incident_id, resolution: 'WO tamam' }, actor);
  }
  appendAudit({
    actor,
    action: 'campus.work_order_done',
    detail: list[idx].title,
    meta: { id: list[idx].id },
  });
  return { ok: true, work_order: list[idx], overview: campusCoreOverview() };
}

function findActiveWorkOrderIndex(list, input = {}) {
  const active = (w) =>
    w.status === 'open' || w.status === 'assigned' || w.status === 'in_progress';
  let idx = list.findIndex((w) => w.id === input.id && active(w));
  if (idx < 0) idx = list.findIndex((w) => active(w));
  return idx;
}

/** İş emri ata — assignee + ajan, status → assigned */
export function assignCampusWorkOrder(input = {}, actor = 'system') {
  const list = readCollection('campus-work-orders', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İş emri yok' };
  let idx = list.findIndex(
    (w) => w.id === input.id && (w.status === 'open' || w.status === 'assigned'),
  );
  if (idx < 0) idx = list.findIndex((w) => w.status === 'open' || w.status === 'assigned');
  if (idx < 0) return { ok: false, error: 'Atanabilir iş emri yok' };
  const zones = ensureZones();
  const zone = zones.find((z) => z.id === list[idx].zone_id);
  const agent = input.agent || list[idx].agent || agentForZone(zone?.kind);
  const assignee = input.assignee || input.crew || actor;
  list[idx] = {
    ...list[idx],
    status: 'assigned',
    assignee,
    agent,
    assigned_at: new Date().toISOString(),
    assigned_by: actor,
    note: input.note || list[idx].note || null,
  };
  writeCollection('campus-work-orders', list);
  const assignment = {
    id: rid('cwa'),
    work_order_id: list[idx].id,
    assignee,
    agent,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-work-order-assignments', assignment, 200);
  enqueueAgentJob(
    {
      agent,
      title: `WO assign · ${list[idx].title} · ${assignee}`,
      priority: list[idx].priority || 'normal',
      payload: { work_order_id: list[idx].id, assignment_id: assignment.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'campus.work_order_assign',
    detail: `${list[idx].title} → ${assignee}`,
    meta: { id: list[idx].id, assignment_id: assignment.id },
  });
  return { ok: true, work_order: list[idx], assignment, overview: campusCoreOverview() };
}

/** İş emri başlat — assigned/open → in_progress */
export function startCampusWorkOrder(input = {}, actor = 'system') {
  const list = readCollection('campus-work-orders', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İş emri yok' };
  let idx = list.findIndex(
    (w) =>
      w.id === input.id &&
      (w.status === 'assigned' || w.status === 'open' || w.status === 'in_progress'),
  );
  if (idx < 0) {
    idx = list.findIndex((w) => w.status === 'assigned' || w.status === 'open');
  }
  if (idx < 0) return { ok: false, error: 'Başlatılacak iş emri yok' };
  if (list[idx].status === 'in_progress') {
    return { ok: true, work_order: list[idx], already: true, overview: campusCoreOverview() };
  }
  list[idx] = {
    ...list[idx],
    status: 'in_progress',
    started_at: new Date().toISOString(),
    started_by: actor,
    assignee: list[idx].assignee || actor,
  };
  writeCollection('campus-work-orders', list);
  enqueueAgentJob(
    {
      agent: list[idx].agent || 'HEPHAESTUS',
      title: `WO start · ${list[idx].title}`,
      priority: list[idx].priority || 'normal',
      payload: { work_order_id: list[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'campus.work_order_start',
    detail: list[idx].title,
    meta: { id: list[idx].id },
  });
  return { ok: true, work_order: list[idx], overview: campusCoreOverview() };
}

/** İş emri escalate — öncelik yükselt + ajan/köprü uyarısı */
export function escalateCampusWorkOrder(input = {}, actor = 'system') {
  const list = readCollection('campus-work-orders', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İş emri yok' };
  const idx = findActiveWorkOrderIndex(list, input);
  if (idx < 0) return { ok: false, error: 'Escalatable iş emri yok' };
  const prev = list[idx].priority || 'normal';
  const next =
    input.priority ||
    (prev === 'critical' ? 'critical' : prev === 'high' ? 'critical' : 'high');
  list[idx] = {
    ...list[idx],
    priority: next,
    escalated: true,
    escalated_at: new Date().toISOString(),
    escalated_by: actor,
    escalate_reason: input.reason || 'sla_risk',
  };
  writeCollection('campus-work-orders', list);
  const esc = {
    id: rid('cwe'),
    work_order_id: list[idx].id,
    from_priority: prev,
    to_priority: next,
    reason: list[idx].escalate_reason,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-work-order-escalations', esc, 120);
  enqueueAgentJob(
    {
      agent: list[idx].agent || 'HEPHAESTUS',
      title: `WO escalate · ${list[idx].title} · ${prev}→${next}`,
      priority: next === 'critical' ? 'critical' : 'high',
      payload: { work_order_id: list[idx].id, escalation_id: esc.id },
    },
    actor,
  );
  enqueueAgentJob(
    {
      agent: 'LİKYA-1',
      title: `kampüs escalate · ${list[idx].zone_name || list[idx].zone_id}`,
      priority: 'high',
      payload: { work_order_id: list[idx].id, reason: esc.reason },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'campus.work_order_escalate',
    detail: `${list[idx].title} · ${prev}→${next}`,
    meta: { id: list[idx].id, escalation_id: esc.id },
  });
  return { ok: true, work_order: list[idx], escalation: esc, overview: campusCoreOverview() };
}

/** Açık incident → iş emri üret */
export function runCampusWorkOrderSweep(input = {}, actor = 'system') {
  const incidents = readCollection('campus-incidents', []) || [];
  const open = (Array.isArray(incidents) ? incidents : []).filter((i) => (i.status || 'open') === 'open');
  const existing = readCollection('campus-work-orders', []) || [];
  const created = [];
  for (const inc of open.slice(0, Number(input.limit) || 12)) {
    if (
      (Array.isArray(existing) ? existing : []).some(
        (w) =>
          w.incident_id === inc.id &&
          (w.status === 'open' || w.status === 'assigned' || w.status === 'in_progress'),
      )
    ) {
      continue;
    }
    const r = createCampusWorkOrder(
      {
        zone_id: inc.zone_id,
        title: `Incident · ${inc.title}`,
        kind: 'incident',
        incident_id: inc.id,
        priority: inc.severity === 'high' || inc.severity === 'critical' ? 'high' : 'normal',
      },
      actor,
    );
    if (r.ok) created.push(r.work_order);
  }
  if (!created.length && input.force) {
    const r = createCampusWorkOrder({ zone_id: input.zone_id || 'z_sport', title: 'Sweep bakım' }, actor);
    if (r.ok) created.push(r.work_order);
  }
  const sweep = {
    id: rid('cws'),
    open_incidents: open.length,
    created: created.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-work-order-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'campus.work_order_sweep',
    detail: `${created.length} WO`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, created, overview: campusCoreOverview() };
}

/** Kampüs kapasite rollup — zon ha × doluluk tahmini */
export function campusCapacityRollup(actor = 'system') {
  const zones = ensureZones();
  const stay = (() => {
    try {
      return readCollection('stay-units', []) || [];
    } catch {
      return [];
    }
  })();
  const stayUnits = Array.isArray(stay) ? stay : [];
  const occupied = stayUnits.filter((u) => u.status === 'occupied' || u.status === 'wintering').length;
  const rollup = {
    id: `ccr_${Date.now().toString(36)}`,
    total_ha: zones.reduce((s, z) => s + (Number(z.hectares) || 0), 0),
    active_zones: zones.filter((z) => z.status === 'active').length,
    protected_ha: zones.filter((z) => z.status === 'protected').reduce((s, z) => s + (Number(z.hectares) || 0), 0),
    stay_units: stayUnits.length,
    stay_occupied: occupied,
    stay_occ_pct: stayUnits.length ? Math.round((occupied / stayUnits.length) * 100) : 0,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-capacity-rollups', rollup, 90);
  appendAudit({
    actor,
    action: 'campus.capacity',
    detail: `${rollup.total_ha}ha · stay %${rollup.stay_occ_pct}`,
    meta: { id: rollup.id },
  });
  return { ok: true, rollup, overview: campusCoreOverview() };
}
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
      title: `incident escalate · ${list[idx].title} · ${to}`,
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
        title: `Escalation · ${list[idx].title}`,
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
    detail: `${list[idx].title} · ${from}→${to}`,
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
      title: `Lockdown · ${list[idx].name}`,
      zone_id: list[idx].id,
      severity: input.severity || 'high',
    },
    actor,
  );
  enqueueAgentJob(
    {
      agent: agentForZone(list[idx].kind),
      title: `zone lockdown · ${list[idx].name}`,
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
        title: `Kapasite alert · stay %${pct}`,
        zone_id: input.zone_id || 'z_glamp',
        severity: pct >= 95 ? 'critical' : 'high',
      },
      actor,
    );
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `capacity alert · stay %${pct}`,
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
    detail: `${alerts.length} alert · %${pct}`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, alerts, rollup: roll.rollup, overview: campusCoreOverview() };
}
