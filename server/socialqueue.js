/**
 * AŞAMA 558 — Social Queue.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('socialqueue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'soc_1', platform: "IG",
      caption: "Likya blue", status: 'queued', at: new Date().toISOString() }];
    writeCollection('socialqueue', seed);
    return seed;
  }
  return list;
}
export function listSocialqueue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSocialqueue(input, actor = 'system') {
  const row = {
    id: `soc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    platform: input.platform !== undefined ? input.platform : "IG",
    caption: input.caption !== undefined ? input.caption : "Likya blue",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('socialqueue', row, 300);
  appendAudit({
    actor,
    action: 'socialqueue.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSocialqueue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('socialqueue', list);
  appendAudit({ actor, action: 'socialqueue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function socialqueueSummary() {
  const list = listSocialqueue();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    posted: list.filter((x) => x.status === 'posted').length,
    failed: list.filter((x) => x.status === 'failed').length, socialqueue: list };
}
