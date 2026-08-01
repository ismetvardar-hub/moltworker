/**
 * AŞAMA 1186 — Board Resolve.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('boardresolve3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'boa_1', resolution: "Alpha",
      owner: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('boardresolve3', seed);
    return seed;
  }
  return list;
}
export function listBoardresolve3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBoardresolve3(input, actor = 'system') {
  const row = {
    id: `boa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    resolution: input.resolution !== undefined ? input.resolution : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('boardresolve3', row, 300);
  appendAudit({
    actor,
    action: 'boardresolve3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBoardresolve3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('boardresolve3', list);
  appendAudit({ actor, action: 'boardresolve3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function boardresolve3Summary() {
  const list = listBoardresolve3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, boardresolve3: list };
}
