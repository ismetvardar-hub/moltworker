import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 179 - Night log incident ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('nightlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ngl_1',
      metric: "No-show",
      value: "2",
      status: 'open',
      type: 'incident',
      at: new Date().toISOString(),
    }];
    writeCollection('nightlog', seed);
    return seed;
  }
  return list;
}

function openNightlogFlags() {
  const flags = readCollection('nightlog-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addNightlogFlag(candidate, actor = 'system') {
  const existing = readCollection('nightlog-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('nglf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('nightlog-flags', list.slice(0, 200));
  return flag;
}

function isOpenIncident(row) {
  return row.type === 'incident' && row.status === 'open';
}

function isAgedIncident(row) {
  return row.agedIncident === true || row.status === 'aging' || Boolean(row.agedAt);
}

function isSecurityNote(row) {
  return row.type === 'security' || row.securityNote === true || row.status === 'security_note';
}

export function listNightlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createNightlog(input = {}, actor = 'system') {
  const row = {
    id: rid('ngl'),
    metric: input.metric !== undefined ? input.metric : "No-show",
    value: input.value !== undefined ? Number(input.value) || 0 : 2,
    note: input.note || null,
    type: input.type || (input.securityNote ? 'security' : 'incident'),
    severity: input.severity || null,
    status: input.status || 'open',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nightlog', row, 300);
  appendAudit({
    actor,
    action: 'nightlog.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateNightlog(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.value !== undefined) next.value = Number(next.value) || 0;
  list[idx] = next;
  writeCollection('nightlog', list);
  appendAudit({ actor, action: 'nightlog.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function nightlogSummary() {
  const list = listNightlog();
  const openIncidents = list.filter(isOpenIncident);
  const agedIncidents = list.filter(isAgedIncident);
  const securityNotes = list.filter(isSecurityNote);
  const flags = openNightlogFlags();
  return {
    title: 'LIKYA Night Log Ops',
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    closed: list.filter((x) => x.status === 'closed').length,
    openIncidents: openIncidents.length,
    agedIncidents: agedIncidents.length,
    securityNotes: securityNotes.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      open: list.filter((x) => x.status === 'open').length,
      closed: list.filter((x) => x.status === 'closed').length,
      open_incidents: openIncidents.length,
      aged_incidents: agedIncidents.length,
      security_notes: securityNotes.length,
    },
    summaryLines: [
      `Night log ${list.length} entry - open incidents ${openIncidents.length} - aged ${agedIncidents.length}`,
      `Closed ${list.filter((x) => x.status === 'closed').length} - security notes ${securityNotes.length} - flags ${flags.length}`,
    ],
    nightlog: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runNightlogSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = nightlogSummary();
  const created = [];
  const candidates = [];
  if (force || overview.openIncidents > 0) {
    candidates.push({
      key: 'nightlog_open_incident_aging',
      level: overview.openIncidents > 0 ? 'warn' : 'info',
      text: `Night log open incidents ${overview.openIncidents}`,
      domain: 'incident',
    });
  }
  if (force || overview.agedIncidents > 0) {
    candidates.push({
      key: 'nightlog_aged_incident_close',
      level: overview.agedIncidents > 0 ? 'warn' : 'info',
      text: `Night log aged incidents ${overview.agedIncidents}`,
      domain: 'close',
    });
  }
  if (force || overview.securityNotes === 0) {
    candidates.push({
      key: 'nightlog_security_note_seed',
      level: 'info',
      text: `Night log security notes ${overview.securityNotes}`,
      domain: 'security',
    });
  }
  for (const candidate of candidates) {
    const flag = addNightlogFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `nightlog sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('ngls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('nightlog-sweeps', sweep, 80);
  appendAudit({ actor, action: 'nightlog.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: nightlogSummary() };
}

export function ackNightlogFlag(input = {}, actor = 'system') {
  const list = readCollection('nightlog-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('nightlog-flags', list);
  appendAudit({ actor, action: 'nightlog.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: nightlogSummary() };
}

export function ageNightlogOpenIncident(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.metric && x.metric === input.metric));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isOpenIncident(x) && !isAgedIncident(x));
  if (idx < 0) return { ok: false, error: 'Aging yapilacak nightlog incident yok' };
  list[idx] = {
    ...list[idx],
    status: 'aging',
    type: 'incident',
    agedIncident: true,
    agedHours: Number(input.agedHours ?? input.hours ?? 6) || 6,
    agedAt: input.agedAt || new Date().toISOString(),
    agedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('nightlog', list);
  appendAudit({ actor, action: 'nightlog.incident_age', detail: list[idx].metric || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, entry: list[idx], overview: nightlogSummary() };
}

export function closeNightlogEntry(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.metric && x.metric === input.metric));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'closed');
  if (idx < 0) return { ok: false, error: 'Kapatilacak nightlog entry yok' };
  list[idx] = {
    ...list[idx],
    status: 'closed',
    closeNote: input.closeNote || input.note || 'night_audit_closed',
    closedAt: input.closedAt || new Date().toISOString(),
    closedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('nightlog', list);
  appendAudit({ actor, action: 'nightlog.close_entry', detail: list[idx].metric || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, entry: list[idx], overview: nightlogSummary() };
}

export function seedNightlogSecurityNote(input = {}, actor = 'system') {
  const entry = createNightlog(
    {
      metric: input.metric || 'Security note',
      value: Number(input.value ?? 1) || 1,
      note: input.note || 'Perimeter patrol brief logged',
      type: 'security',
      securityNote: true,
      severity: input.severity || 'info',
      status: input.status || 'open',
    },
    actor,
  );
  updateNightlog(entry.id, { securityNote: true, securityNoteAt: input.securityNoteAt || new Date().toISOString() }, actor);
  appendAudit({ actor, action: 'nightlog.seed_security_note', detail: entry.metric, meta: { id: entry.id } });
  return {
    ok: true,
    entry: { ...entry, securityNote: true, securityNoteAt: input.securityNoteAt || new Date().toISOString() },
    overview: nightlogSummary(),
  };
}
