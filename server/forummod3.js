/**
 * AŞAMA 1145 — Forum Mod.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('forummod3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'for_1', thread: "Alpha",
      flag: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('forummod3', seed);
    return seed;
  }
  return list;
}
export function listForummod3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createForummod3(input, actor = 'system') {
  const row = {
    id: `for_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    thread: input.thread !== undefined ? input.thread : "Alpha",
    flag: input.flag !== undefined ? input.flag : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('forummod3', row, 300);
  appendAudit({
    actor,
    action: 'forummod3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateForummod3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('forummod3', list);
  appendAudit({ actor, action: 'forummod3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function forummod3Summary() {
  const list = listForummod3();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, forummod3: list };
}
