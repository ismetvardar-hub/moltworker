/**
 * AŞAMA 859 — Standard OP.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('standardop', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sta_1', sop: "Alpha",
      version: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('standardop', seed);
    return seed;
  }
  return list;
}
export function listStandardop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStandardop(input, actor = 'system') {
  const row = {
    id: `sta_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sop: input.sop !== undefined ? input.sop : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('standardop', row, 300);
  appendAudit({
    actor,
    action: 'standardop.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStandardop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('standardop', list);
  appendAudit({ actor, action: 'standardop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function standardopSummary() {
  const list = listStandardop();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, standardop: list };
}
