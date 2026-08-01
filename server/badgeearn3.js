/**
 * AŞAMA 1147 — Badge Earn.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('badgeearn3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bad_1', member: "Alpha",
      badge: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('badgeearn3', seed);
    return seed;
  }
  return list;
}
export function listBadgeearn3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBadgeearn3(input, actor = 'system') {
  const row = {
    id: `bad_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    member: input.member !== undefined ? input.member : "Alpha",
    badge: input.badge !== undefined ? input.badge : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('badgeearn3', row, 300);
  appendAudit({
    actor,
    action: 'badgeearn3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBadgeearn3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('badgeearn3', list);
  appendAudit({ actor, action: 'badgeearn3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function badgeearn3Summary() {
  const list = listBadgeearn3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, badgeearn3: list };
}
