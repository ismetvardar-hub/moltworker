/**
 * AŞAMA 197 — Kuyruk Süresi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('queuetimes', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'que_1', point: "Check-in",
      minutes: "8", status: 'ok', at: new Date().toISOString() }];
    writeCollection('queuetimes', seed);
    return seed;
  }
  return list;
}
export function listQueuetimes(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createQueuetimes(input, actor = 'system') {
  const row = {
    id: `que_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    point: input.point !== undefined ? input.point : "Check-in",
    minutes: input.minutes !== undefined ? Number(input.minutes) || 0 : 8,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('queuetimes', row, 300);
  appendAudit({ actor, action: 'queuetimes.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateQueuetimes(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('queuetimes', list);
  appendAudit({ actor, action: 'queuetimes.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function queuetimesSummary() {
  const list = listQueuetimes();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    busy: list.filter((x) => x.status === 'busy').length,
    critical: list.filter((x) => x.status === 'critical').length, queuetimes: list };
}
