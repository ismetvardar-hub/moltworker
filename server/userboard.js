/**
 * AŞAMA 802 — User Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('userboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'use_1', insight: "Alpha",
      owner: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('userboard', seed);
    return seed;
  }
  return list;
}
export function listUserboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUserboard(input, actor = 'system') {
  const row = {
    id: `use_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    insight: input.insight !== undefined ? input.insight : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('userboard', row, 300);
  appendAudit({
    actor,
    action: 'userboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateUserboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('userboard', list);
  appendAudit({ actor, action: 'userboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function userboardSummary() {
  const list = listUserboard();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, userboard: list };
}
