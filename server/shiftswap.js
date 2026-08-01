/**
 * AŞAMA 261 — Vardiya Takas.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shiftswap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'swp_1', fromEmp: "Ali",
      toEmp: "Veli", status: 'requested', at: new Date().toISOString() }];
    writeCollection('shiftswap', seed);
    return seed;
  }
  return list;
}
export function listShiftswap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShiftswap(input, actor = 'system') {
  const row = {
    id: `swp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    fromEmp: input.fromEmp !== undefined ? input.fromEmp : "Ali",
    toEmp: input.toEmp !== undefined ? input.toEmp : "Veli",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shiftswap', row, 300);
  appendAudit({ actor, action: 'shiftswap.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateShiftswap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shiftswap', list);
  appendAudit({ actor, action: 'shiftswap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shiftswapSummary() {
  const list = listShiftswap();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, shiftswap: list };
}
