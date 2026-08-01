/**
 * AŞAMA 724 — Dock Yard.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dockyard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'doc_1', bay: "Alpha",
      truck: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('dockyard', seed);
    return seed;
  }
  return list;
}
export function listDockyard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDockyard(input, actor = 'system') {
  const row = {
    id: `doc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "Alpha",
    truck: input.truck !== undefined ? input.truck : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dockyard', row, 300);
  appendAudit({
    actor,
    action: 'dockyard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDockyard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dockyard', list);
  appendAudit({ actor, action: 'dockyard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dockyardSummary() {
  const list = listDockyard();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, dockyard: list };
}
