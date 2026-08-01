/**
 * AŞAMA 769 — Rate Limit+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ratelimit2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rat_1', route: "Alpha",
      limit: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('ratelimit2', seed);
    return seed;
  }
  return list;
}
export function listRatelimit2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRatelimit2(input, actor = 'system') {
  const row = {
    id: `rat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "Alpha",
    limit: input.limit !== undefined ? Number(input.limit) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ratelimit2', row, 300);
  appendAudit({
    actor,
    action: 'ratelimit2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRatelimit2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ratelimit2', list);
  appendAudit({ actor, action: 'ratelimit2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ratelimit2Summary() {
  const list = listRatelimit2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, ratelimit2: list };
}
