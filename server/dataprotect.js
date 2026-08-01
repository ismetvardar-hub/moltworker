/**
 * AŞAMA 280 — Veri Koruma.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dataprotect', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dpr_1', request: "Silme",
      subject: "Misafir", status: 'open', at: new Date().toISOString() }];
    writeCollection('dataprotect', seed);
    return seed;
  }
  return list;
}
export function listDataprotect(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDataprotect(input, actor = 'system') {
  const row = {
    id: `dpr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    request: input.request !== undefined ? input.request : "Silme",
    subject: input.subject !== undefined ? input.subject : "Misafir",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dataprotect', row, 300);
  appendAudit({ actor, action: 'dataprotect.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateDataprotect(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dataprotect', list);
  appendAudit({ actor, action: 'dataprotect.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dataprotectSummary() {
  const list = listDataprotect();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    fulfilled: list.filter((x) => x.status === 'fulfilled').length,
    rejected: list.filter((x) => x.status === 'rejected').length, dataprotect: list };
}
