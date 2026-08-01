/**
 * AŞAMA 552 — Praise.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('praise', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prs_1', guestName: "Misafir",
      staff: "Ela", status: 'logged', at: new Date().toISOString() }];
    writeCollection('praise', seed);
    return seed;
  }
  return list;
}
export function listPraise(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPraise(input, actor = 'system') {
  const row = {
    id: `prs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    staff: input.staff !== undefined ? input.staff : "Ela",
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('praise', row, 300);
  appendAudit({
    actor,
    action: 'praise.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePraise(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('praise', list);
  appendAudit({ actor, action: 'praise.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function praiseSummary() {
  const list = listPraise();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    shared: list.filter((x) => x.status === 'shared').length,
    rewarded: list.filter((x) => x.status === 'rewarded').length, praise: list };
}
