/**
 * AŞAMA 693 — Role Grant.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rolegrant', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rol_1', person: "Alpha",
      role: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('rolegrant', seed);
    return seed;
  }
  return list;
}
export function listRolegrant(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRolegrant(input, actor = 'system') {
  const row = {
    id: `rol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Alpha",
    role: input.role !== undefined ? input.role : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rolegrant', row, 300);
  appendAudit({
    actor,
    action: 'rolegrant.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRolegrant(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rolegrant', list);
  appendAudit({ actor, action: 'rolegrant.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rolegrantSummary() {
  const list = listRolegrant();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, rolegrant: list };
}
