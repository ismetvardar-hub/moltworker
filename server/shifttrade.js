/**
 * AŞAMA 509 — Shift Trade.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shifttrade', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'str_1', from: "Can",
      to: "Ela", status: 'requested', at: new Date().toISOString() }];
    writeCollection('shifttrade', seed);
    return seed;
  }
  return list;
}
export function listShifttrade(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShifttrade(input, actor = 'system') {
  const row = {
    id: `str_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "Can",
    to: input.to !== undefined ? input.to : "Ela",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shifttrade', row, 300);
  appendAudit({
    actor,
    action: 'shifttrade.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateShifttrade(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shifttrade', list);
  appendAudit({ actor, action: 'shifttrade.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shifttradeSummary() {
  const list = listShifttrade();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, shifttrade: list };
}
