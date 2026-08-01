/**
 * AŞAMA 1129 — Rate Limit+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ratelimit23', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rat_1', route: "Alpha",
      limit: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('ratelimit23', seed);
    return seed;
  }
  return list;
}
export function listRatelimit23(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRatelimit23(input, actor = 'system') {
  const row = {
    id: `rat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "Alpha",
    limit: input.limit !== undefined ? Number(input.limit) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ratelimit23', row, 300);
  appendAudit({
    actor,
    action: 'ratelimit23.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRatelimit23(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ratelimit23', list);
  appendAudit({ actor, action: 'ratelimit23.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ratelimit23Summary() {
  const list = listRatelimit23();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, ratelimit23: list };
}
