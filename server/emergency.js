/**
 * AŞAMA 74 — Acil Rehber.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const MINUTE_MS = 60_000;
const OPEN_INCIDENT_STATUSES = new Set(['open', 'acknowledged', 'monitoring']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('emergency-contacts', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "em_1",
    "name": "Gece Müdürü",
    "phone": "+905551112233",
    "role": "duty-manager"
  }
];
    writeCollection('emergency-contacts', seed);
    return seed;
  }
  return list;
}

function ensureIncidents() {
  const list = readCollection('emergency-incidents', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [
      {
        id: 'emi_1',
        title: 'Pool deck slip',
        severity: 'medium',
        status: 'open',
        channel: 'ops',
        openedAt: now.toISOString(),
        at: now.toISOString(),
      },
    ];
    writeCollection('emergency-incidents', seed);
    return seed;
  }
  return list;
}

function isAgingIncident(incident) {
  if (!OPEN_INCIDENT_STATUSES.has(incident.status)) return false;
  const opened = Date.parse(incident.openedAt || incident.at || incident.createdAt || '');
  const thresholdMin = Number(incident.agingMinutes || 30);
  return Number.isFinite(opened) && opened + thresholdMin * MINUTE_MS < Date.now();
}

function openEmergencyFlags() {
  const flags = readCollection('emergency-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addEmergencyFlag(candidate, actor = 'system') {
  const existing = readCollection('emergency-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('emf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('emergency-flags', list.slice(0, 200));
  return flag;
}

export function listEmergency(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createEmergency(input = {}, actor = 'system') {
  const row = {
    id: `eme_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"name":"İsim","phone":"+90","role":"role"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"name":"İsim","phone":"+90","role":"role"}[k]];
    })),
    status: input.status || null,
    at: new Date().toISOString(),
    createdBy: actor,
  };
  if (row.qty !== undefined) row.qty = Number(row.qty) || 0;
  if (row.minutes !== undefined) row.minutes = Number(row.minutes) || 0;
  if (row.score !== undefined) row.score = Number(row.score) || 0;
  if (row.planned !== undefined) row.planned = Number(row.planned) || 0;
  if (row.actual !== undefined) row.actual = Number(row.actual) || 0;
  if (row.balance !== undefined) row.balance = Number(row.balance) || 0;
  if (row.etaMin !== undefined) row.etaMin = Number(row.etaMin) || 0;
  if (row.minQty !== undefined) row.minQty = Number(row.minQty) || 0;
  if (row.partySize !== undefined) row.partySize = Number(row.partySize) || 0;
  if (row.costTry !== undefined) row.costTry = Number(row.costTry) || 0;
  if (row.seats !== undefined) row.seats = Number(row.seats) || 0;
  delete row.status;
  prependItem('emergency-contacts', row, 300);
  appendAudit({ actor, action: 'emergency.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateEmergency(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('emergency-contacts', list);
  appendAudit({ actor, action: 'emergency.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function emergencySummary() {
  const list = listEmergency();
  const incidents = ensureIncidents().sort((a, b) => String(b.at || b.openedAt || '').localeCompare(String(a.at || a.openedAt || '')));
  const aging = incidents.filter(isAgingIncident);
  const open = incidents.filter((x) => OPEN_INCIDENT_STATUSES.has(x.status));
  const drills = incidents.filter((x) => x.kind === 'drill');
  const flags = openEmergencyFlags();
  return {
    title: 'LİKYA Acil Durum Ops',
    total: list.length,
    openIncidents: open.length,
    agingIncidents: aging.length,
    acknowledged: incidents.filter((x) => x.status === 'acknowledged').length,
    drills: drills.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      contacts: list.length,
      incidents: incidents.length,
      open_incidents: open.length,
      aging_incidents: aging.length,
      acknowledged: incidents.filter((x) => x.status === 'acknowledged').length,
      drills: drills.length,
    },
    summaryLines: [
      `Acil olay ${incidents.length} · açık ${open.length} · aging ${aging.length}`,
      `Drill ${drills.length} · ack ${incidents.filter((x) => x.status === 'acknowledged').length} · flag ${flags.length}`,
    ],
    contacts: list,
    incidents,
    generatedAt: new Date().toISOString(),
  };
}

export function runEmergencySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = emergencySummary();
  const created = [];
  const candidates = [];
  if (force || overview.agingIncidents > 0) {
    candidates.push({
      key: 'emergency_open_incident_aging',
      level: overview.agingIncidents > 0 ? 'alert' : 'info',
      text: `Yaşlanan açık acil olay ${overview.agingIncidents}`,
      domain: 'incident',
    });
  }
  if (force || overview.openIncidents > 0) {
    candidates.push({
      key: 'emergency_open_incidents',
      level: overview.openIncidents > 0 ? 'warn' : 'info',
      text: `Açık acil olay ${overview.openIncidents}`,
      domain: 'response',
    });
  }
  if (force || overview.drills === 0) {
    candidates.push({
      key: 'emergency_drill_schedule',
      level: overview.drills === 0 ? 'warn' : 'info',
      text: `Acil durum drill kaydı ${overview.drills}`,
      domain: 'drill',
    });
  }
  for (const candidate of candidates) {
    const flag = addEmergencyFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'AETHER',
        title: `emergency sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('ems'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('emergency-sweeps', sweep, 80);
  appendAudit({ actor, action: 'emergency.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: emergencySummary() };
}

export function ackEmergencyFlag(input = {}, actor = 'system') {
  const list = readCollection('emergency-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('emergency-flags', list);
  appendAudit({ actor, action: 'emergency.flag_ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: emergencySummary() };
}

export function acknowledgeEmergencyIncident(input = {}, actor = 'system') {
  const list = ensureIncidents();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'open');
  if (idx < 0) return { ok: false, error: 'Ack edilecek açık olay yok' };
  list[idx] = {
    ...list[idx],
    status: 'acknowledged',
    acknowledgedAt: input.acknowledgedAt || new Date().toISOString(),
    acknowledgedBy: actor,
    note: input.note || list[idx].note || 'Ops ack',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('emergency-incidents', list);
  appendAudit({ actor, action: 'emergency.incident_ack', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, incident: list[idx], overview: emergencySummary() };
}

export function closeEmergencyIncident(input = {}, actor = 'system') {
  const list = ensureIncidents();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => OPEN_INCIDENT_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Kapatılacak acil olay yok' };
  list[idx] = {
    ...list[idx],
    status: 'closed',
    closedAt: input.closedAt || new Date().toISOString(),
    closedBy: actor,
    resolution: input.resolution || list[idx].resolution || 'Ops resolved',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('emergency-incidents', list);
  appendAudit({ actor, action: 'emergency.incident_close', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, incident: list[idx], overview: emergencySummary() };
}

export function seedEmergencyDrill(input = {}, actor = 'system') {
  const agingMinutes = Number(input.agingMinutes ?? 30) || 30;
  const incident = {
    id: rid('emi'),
    title: input.title || 'Ops evacuation drill',
    kind: 'drill',
    severity: input.severity || 'low',
    status: input.status || 'open',
    channel: input.channel || 'ops-drill',
    agingMinutes,
    openedAt: input.openedAt || new Date(Date.now() - (agingMinutes + 10) * MINUTE_MS).toISOString(),
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('emergency-incidents', incident, 300);
  appendAudit({ actor, action: 'emergency.seed_drill', detail: incident.title, meta: { id: incident.id } });
  return { ok: true, incident, overview: emergencySummary() };
}
