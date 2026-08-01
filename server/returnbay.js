/**
 * AŞAMA 657 — Return Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('returnbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rtb_1', ticket: "R-19",
      sku: "RE-BAG", status: 'received', at: new Date().toISOString() }];
    writeCollection('returnbay', seed);
    return seed;
  }
  return list;
}
export function listReturnbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReturnbay(input, actor = 'system') {
  const row = {
    id: `rtb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ticket: input.ticket !== undefined ? input.ticket : "R-19",
    sku: input.sku !== undefined ? input.sku : "RE-BAG",
    status: input.status || 'received',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('returnbay', row, 300);
  appendAudit({
    actor,
    action: 'returnbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateReturnbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('returnbay', list);
  appendAudit({ actor, action: 'returnbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function returnbaySummary() {
  const list = listReturnbay();
  return { total: list.length, received: list.filter((x) => x.status === 'received').length,
    inspect: list.filter((x) => x.status === 'inspect').length,
    restock: list.filter((x) => x.status === 'restock').length,
    scrap: list.filter((x) => x.status === 'scrap').length, returnbay: list };
}
