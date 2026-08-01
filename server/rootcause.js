/**
 * AŞAMA 869 — Root Cause.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rootcause', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'roo_1', incident: "Alpha",
      cause: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('rootcause', seed);
    return seed;
  }
  return list;
}
export function listRootcause(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRootcause(input, actor = 'system') {
  const row = {
    id: `roo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    incident: input.incident !== undefined ? input.incident : "Alpha",
    cause: input.cause !== undefined ? input.cause : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rootcause', row, 300);
  appendAudit({
    actor,
    action: 'rootcause.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRootcause(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rootcause', list);
  appendAudit({ actor, action: 'rootcause.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rootcauseSummary() {
  const list = listRootcause();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, rootcause: list };
}
