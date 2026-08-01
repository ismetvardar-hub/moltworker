/**
 * AŞAMA 458 — Bar Rail.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('barrail', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'brr_1', drink: "Likya Spritz",
      guestName: "Misafir", status: 'queued', at: new Date().toISOString() }];
    writeCollection('barrail', seed);
    return seed;
  }
  return list;
}
export function listBarrail(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBarrail(input, actor = 'system') {
  const row = {
    id: `brr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    drink: input.drink !== undefined ? input.drink : "Likya Spritz",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('barrail', row, 300);
  appendAudit({
    actor,
    action: 'barrail.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBarrail(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('barrail', list);
  appendAudit({ actor, action: 'barrail.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function barrailSummary() {
  const list = listBarrail();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    shaking: list.filter((x) => x.status === 'shaking').length,
    served: list.filter((x) => x.status === 'served').length, barrail: list };
}
