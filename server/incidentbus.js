/**
 * AŞAMA 361 — Incident Bus.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('incidentbus', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ibs_1', topic: "gate.jam",
      payload: "Gate-2", status: 'queued', at: new Date().toISOString() }];
    writeCollection('incidentbus', seed);
    return seed;
  }
  return list;
}
export function listIncidentbus(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIncidentbus(input, actor = 'system') {
  const row = {
    id: `ibs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "gate.jam",
    payload: input.payload !== undefined ? input.payload : "Gate-2",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('incidentbus', row, 300);
  appendAudit({
    actor,
    action: 'incidentbus.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIncidentbus(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('incidentbus', list);
  appendAudit({ actor, action: 'incidentbus.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function incidentbusSummary() {
  const list = listIncidentbus();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    consumed: list.filter((x) => x.status === 'consumed').length,
    dead: list.filter((x) => x.status === 'dead').length, incidentbus: list };
}
