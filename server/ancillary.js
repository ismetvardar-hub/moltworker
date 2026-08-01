/**
 * AŞAMA 378 — Ancillary.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ancillary', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'anc_1', item: "Transfer",
      amount: "900", status: 'booked', at: new Date().toISOString() }];
    writeCollection('ancillary', seed);
    return seed;
  }
  return list;
}
export function listAncillary(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAncillary(input, actor = 'system') {
  const row = {
    id: `anc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Transfer",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 900,
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ancillary', row, 300);
  appendAudit({
    actor,
    action: 'ancillary.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAncillary(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ancillary', list);
  appendAudit({ actor, action: 'ancillary.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ancillarySummary() {
  const list = listAncillary();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    fulfilled: list.filter((x) => x.status === 'fulfilled').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, ancillary: list };
}
