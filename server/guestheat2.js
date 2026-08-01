/**
 * AŞAMA 952 — Guest Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guestheat2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gue_1', segment: "Alpha",
      score: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('guestheat2', seed);
    return seed;
  }
  return list;
}
export function listGuestheat2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuestheat2(input, actor = 'system') {
  const row = {
    id: `gue_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    segment: input.segment !== undefined ? input.segment : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestheat2', row, 300);
  appendAudit({
    actor,
    action: 'guestheat2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuestheat2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestheat2', list);
  appendAudit({ actor, action: 'guestheat2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guestheat2Summary() {
  const list = listGuestheat2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, guestheat2: list };
}
