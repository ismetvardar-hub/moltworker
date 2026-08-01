/**
 * AŞAMA 1194 — Cold Site.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('coldsite3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'col_1', site: "Alpha",
      readiness: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('coldsite3', seed);
    return seed;
  }
  return list;
}
export function listColdsite3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createColdsite3(input, actor = 'system') {
  const row = {
    id: `col_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    readiness: input.readiness !== undefined ? input.readiness : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('coldsite3', row, 300);
  appendAudit({
    actor,
    action: 'coldsite3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateColdsite3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('coldsite3', list);
  appendAudit({ actor, action: 'coldsite3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function coldsite3Summary() {
  const list = listColdsite3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, coldsite3: list };
}
