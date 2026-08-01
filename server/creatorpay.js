/**
 * AŞAMA 666 — Creator Pay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('creatorpay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crp_1', creator: "@travel",
      amount: "15000", status: 'due', at: new Date().toISOString() }];
    writeCollection('creatorpay', seed);
    return seed;
  }
  return list;
}
export function listCreatorpay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCreatorpay(input, actor = 'system') {
  const row = {
    id: `crp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    creator: input.creator !== undefined ? input.creator : "@travel",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 15000,
    status: input.status || 'due',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('creatorpay', row, 300);
  appendAudit({
    actor,
    action: 'creatorpay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCreatorpay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('creatorpay', list);
  appendAudit({ actor, action: 'creatorpay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function creatorpaySummary() {
  const list = listCreatorpay();
  return { total: list.length, due: list.filter((x) => x.status === 'due').length,
    paid: list.filter((x) => x.status === 'paid').length,
    hold: list.filter((x) => x.status === 'hold').length, creatorpay: list };
}
