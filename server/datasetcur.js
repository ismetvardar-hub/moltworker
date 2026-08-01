/**
 * AŞAMA 309 — Dataset Kürasyon.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('datasetcur', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dsc_1', name: "Vision FAQ",
      rows: "500", status: 'draft', at: new Date().toISOString() }];
    writeCollection('datasetcur', seed);
    return seed;
  }
  return list;
}
export function listDatasetcur(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDatasetcur(input, actor = 'system') {
  const row = {
    id: `dsc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Vision FAQ",
    rows: input.rows !== undefined ? Number(input.rows) || 0 : 500,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('datasetcur', row, 300);
  appendAudit({ actor, action: 'datasetcur.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateDatasetcur(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('datasetcur', list);
  appendAudit({ actor, action: 'datasetcur.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function datasetcurSummary() {
  const list = listDatasetcur();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    archived: list.filter((x) => x.status === 'archived').length, datasetcur: list };
}
