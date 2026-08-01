/**
 * AŞAMA 667 — UGC Queue.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ugcqueue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ugq_1', post: "Guest reel",
      flag: "OK", status: 'queued', at: new Date().toISOString() }];
    writeCollection('ugcqueue', seed);
    return seed;
  }
  return list;
}
export function listUgcqueue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUgcqueue(input, actor = 'system') {
  const row = {
    id: `ugq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    post: input.post !== undefined ? input.post : "Guest reel",
    flag: input.flag !== undefined ? input.flag : "OK",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ugcqueue', row, 300);
  appendAudit({
    actor,
    action: 'ugcqueue.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateUgcqueue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ugcqueue', list);
  appendAudit({ actor, action: 'ugcqueue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ugcqueueSummary() {
  const list = listUgcqueue();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, ugcqueue: list };
}
