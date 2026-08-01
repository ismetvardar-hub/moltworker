/**
 * AŞAMA 531 — Dataset Cat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('datasetcat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dsc_1', name: "fnb_tickets",
      owner: "Data", status: 'registered', at: new Date().toISOString() }];
    writeCollection('datasetcat', seed);
    return seed;
  }
  return list;
}
export function listDatasetcat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDatasetcat(input, actor = 'system') {
  const row = {
    id: `dsc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "fnb_tickets",
    owner: input.owner !== undefined ? input.owner : "Data",
    status: input.status || 'registered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('datasetcat', row, 300);
  appendAudit({
    actor,
    action: 'datasetcat.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDatasetcat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('datasetcat', list);
  appendAudit({ actor, action: 'datasetcat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function datasetcatSummary() {
  const list = listDatasetcat();
  return { total: list.length, registered: list.filter((x) => x.status === 'registered').length,
    certified: list.filter((x) => x.status === 'certified').length,
    stale: list.filter((x) => x.status === 'stale').length, datasetcat: list };
}
