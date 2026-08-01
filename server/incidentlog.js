/**
 * AŞAMA 512 — Incident Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('incidentlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inc_1', type: "Slip",
      severity: "2", status: 'reported', at: new Date().toISOString() }];
    writeCollection('incidentlog', seed);
    return seed;
  }
  return list;
}
export function listIncidentlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIncidentlog(input, actor = 'system') {
  const row = {
    id: `inc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    type: input.type !== undefined ? input.type : "Slip",
    severity: input.severity !== undefined ? Number(input.severity) || 0 : 2,
    status: input.status || 'reported',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('incidentlog', row, 300);
  appendAudit({
    actor,
    action: 'incidentlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIncidentlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('incidentlog', list);
  appendAudit({ actor, action: 'incidentlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function incidentlogSummary() {
  const list = listIncidentlog();
  return { total: list.length, reported: list.filter((x) => x.status === 'reported').length,
    investigating: list.filter((x) => x.status === 'investigating').length,
    closed: list.filter((x) => x.status === 'closed').length, incidentlog: list };
}
