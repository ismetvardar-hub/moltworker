/**
 * AŞAMA 204 — Gate Kuyruk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('gatequeue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gtq_1', gate: "Main",
      waiting: "12", status: 'flow', at: new Date().toISOString() }];
    writeCollection('gatequeue', seed);
    return seed;
  }
  return list;
}
export function listGatequeue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGatequeue(input, actor = 'system') {
  const row = {
    id: `gtq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "Main",
    waiting: input.waiting !== undefined ? Number(input.waiting) || 0 : 12,
    status: input.status || 'flow',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('gatequeue', row, 300);
  appendAudit({ actor, action: 'gatequeue.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateGatequeue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('gatequeue', list);
  appendAudit({ actor, action: 'gatequeue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function gatequeueSummary() {
  const list = listGatequeue();
  return { total: list.length, flow: list.filter((x) => x.status === 'flow').length,
    slow: list.filter((x) => x.status === 'slow').length,
    stop: list.filter((x) => x.status === 'stop').length, gatequeue: list };
}
