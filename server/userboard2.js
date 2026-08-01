/**
 * AŞAMA 1012 — User Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('userboard2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'use_1', insight: "Alpha",
      owner: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('userboard2', seed);
    return seed;
  }
  return list;
}
export function listUserboard2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUserboard2(input, actor = 'system') {
  const row = {
    id: `use_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    insight: input.insight !== undefined ? input.insight : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('userboard2', row, 300);
  appendAudit({
    actor,
    action: 'userboard2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateUserboard2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('userboard2', list);
  appendAudit({ actor, action: 'userboard2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function userboard2Summary() {
  const list = listUserboard2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, userboard2: list };
}
