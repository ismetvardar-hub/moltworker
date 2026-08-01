/**
 * AŞAMA 997 — Badge Earn.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('badgeearn2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bad_1', member: "Alpha",
      badge: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('badgeearn2', seed);
    return seed;
  }
  return list;
}
export function listBadgeearn2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBadgeearn2(input, actor = 'system') {
  const row = {
    id: `bad_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    member: input.member !== undefined ? input.member : "Alpha",
    badge: input.badge !== undefined ? input.badge : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('badgeearn2', row, 300);
  appendAudit({
    actor,
    action: 'badgeearn2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBadgeearn2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('badgeearn2', list);
  appendAudit({ actor, action: 'badgeearn2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function badgeearn2Summary() {
  const list = listBadgeearn2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, badgeearn2: list };
}
