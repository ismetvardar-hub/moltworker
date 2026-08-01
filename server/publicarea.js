/**
 * AŞAMA 614 — Public Area.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('publicarea', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pba_1', zone: "Lobby",
      crew: "2", status: 'queued', at: new Date().toISOString() }];
    writeCollection('publicarea', seed);
    return seed;
  }
  return list;
}
export function listPublicarea(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPublicarea(input, actor = 'system') {
  const row = {
    id: `pba_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Lobby",
    crew: input.crew !== undefined ? Number(input.crew) || 0 : 2,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('publicarea', row, 300);
  appendAudit({
    actor,
    action: 'publicarea.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePublicarea(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('publicarea', list);
  appendAudit({ actor, action: 'publicarea.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function publicareaSummary() {
  const list = listPublicarea();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, publicarea: list };
}
