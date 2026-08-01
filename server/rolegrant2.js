/**
 * AŞAMA 903 — Role Grant.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rolegrant2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rol_1', person: "Alpha",
      role: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('rolegrant2', seed);
    return seed;
  }
  return list;
}
export function listRolegrant2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRolegrant2(input, actor = 'system') {
  const row = {
    id: `rol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Alpha",
    role: input.role !== undefined ? input.role : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rolegrant2', row, 300);
  appendAudit({
    actor,
    action: 'rolegrant2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRolegrant2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rolegrant2', list);
  appendAudit({ actor, action: 'rolegrant2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rolegrant2Summary() {
  const list = listRolegrant2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, rolegrant2: list };
}
