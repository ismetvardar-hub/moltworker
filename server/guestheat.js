/**
 * AŞAMA 742 — Guest Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guestheat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gue_1', segment: "Alpha",
      score: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('guestheat', seed);
    return seed;
  }
  return list;
}
export function listGuestheat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuestheat(input, actor = 'system') {
  const row = {
    id: `gue_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    segment: input.segment !== undefined ? input.segment : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestheat', row, 300);
  appendAudit({
    actor,
    action: 'guestheat.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuestheat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestheat', list);
  appendAudit({ actor, action: 'guestheat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guestheatSummary() {
  const list = listGuestheat();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, guestheat: list };
}
