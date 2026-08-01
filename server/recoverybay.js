/**
 * AŞAMA 474 — Recovery Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('recoverybay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rcv_1', bay: "NormaTec",
      guestName: "Misafir", status: 'free', at: new Date().toISOString() }];
    writeCollection('recoverybay', seed);
    return seed;
  }
  return list;
}
export function listRecoverybay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRecoverybay(input, actor = 'system') {
  const row = {
    id: `rcv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "NormaTec",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('recoverybay', row, 300);
  appendAudit({
    actor,
    action: 'recoverybay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRecoverybay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('recoverybay', list);
  appendAudit({ actor, action: 'recoverybay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function recoverybaySummary() {
  const list = listRecoverybay();
  return { total: list.length, free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    sanitize: list.filter((x) => x.status === 'sanitize').length, recoverybay: list };
}
