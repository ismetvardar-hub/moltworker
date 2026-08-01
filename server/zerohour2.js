/**
 * AŞAMA 914 — Zero Hour.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('zerohour2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'zer_1', drill: "Alpha",
      score: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('zerohour2', seed);
    return seed;
  }
  return list;
}
export function listZerohour2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createZerohour2(input, actor = 'system') {
  const row = {
    id: `zer_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    drill: input.drill !== undefined ? input.drill : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('zerohour2', row, 300);
  appendAudit({
    actor,
    action: 'zerohour2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateZerohour2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('zerohour2', list);
  appendAudit({ actor, action: 'zerohour2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function zerohour2Summary() {
  const list = listZerohour2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, zerohour2: list };
}
