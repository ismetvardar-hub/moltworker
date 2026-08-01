/**
 * AŞAMA 419 — Sahil Devriye.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('coastpatrol', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cpt_1', beat: "North",
      guard: "Can", status: 'on_post', at: new Date().toISOString() }];
    writeCollection('coastpatrol', seed);
    return seed;
  }
  return list;
}
export function listCoastpatrol(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCoastpatrol(input, actor = 'system') {
  const row = {
    id: `cpt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    beat: input.beat !== undefined ? input.beat : "North",
    guard: input.guard !== undefined ? input.guard : "Can",
    status: input.status || 'on_post',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('coastpatrol', row, 300);
  appendAudit({
    actor,
    action: 'coastpatrol.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCoastpatrol(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('coastpatrol', list);
  appendAudit({ actor, action: 'coastpatrol.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function coastpatrolSummary() {
  const list = listCoastpatrol();
  return { total: list.length, on_post: list.filter((x) => x.status === 'on_post').length,
    patrol: list.filter((x) => x.status === 'patrol').length,
    relief: list.filter((x) => x.status === 'relief').length, coastpatrol: list };
}
