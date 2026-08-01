/**
 * AŞAMA 856 — Post Launch.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('postlaunch', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pos_1', site: "Alpha",
      score: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('postlaunch', seed);
    return seed;
  }
  return list;
}
export function listPostlaunch(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPostlaunch(input, actor = 'system') {
  const row = {
    id: `pos_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('postlaunch', row, 300);
  appendAudit({
    actor,
    action: 'postlaunch.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePostlaunch(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('postlaunch', list);
  appendAudit({ actor, action: 'postlaunch.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function postlaunchSummary() {
  const list = listPostlaunch();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, postlaunch: list };
}
