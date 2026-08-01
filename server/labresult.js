/**
 * AŞAMA 864 — Lab Result.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('labresult', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lab_1', sample: "Alpha",
      result: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('labresult', seed);
    return seed;
  }
  return list;
}
export function listLabresult(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLabresult(input, actor = 'system') {
  const row = {
    id: `lab_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sample: input.sample !== undefined ? input.sample : "Alpha",
    result: input.result !== undefined ? input.result : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('labresult', row, 300);
  appendAudit({
    actor,
    action: 'labresult.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLabresult(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('labresult', list);
  appendAudit({ actor, action: 'labresult.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function labresultSummary() {
  const list = listLabresult();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, labresult: list };
}
