/**
 * AŞAMA 893 — Summit Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('summitnote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sum_1', title: "Alpha",
      owner: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('summitnote', seed);
    return seed;
  }
  return list;
}
export function listSummitnote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSummitnote(input, actor = 'system') {
  const row = {
    id: `sum_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('summitnote', row, 300);
  appendAudit({
    actor,
    action: 'summitnote.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSummitnote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('summitnote', list);
  appendAudit({ actor, action: 'summitnote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function summitnoteSummary() {
  const list = listSummitnote();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, summitnote: list };
}
