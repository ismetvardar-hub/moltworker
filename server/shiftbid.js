/**
 * AŞAMA 497 — Shift Bid.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shiftbid', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sbid_1', shift: "Dinner Fri",
      bidder: "Can", status: 'open', at: new Date().toISOString() }];
    writeCollection('shiftbid', seed);
    return seed;
  }
  return list;
}
export function listShiftbid(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShiftbid(input, actor = 'system') {
  const row = {
    id: `sbid_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    shift: input.shift !== undefined ? input.shift : "Dinner Fri",
    bidder: input.bidder !== undefined ? input.bidder : "Can",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shiftbid', row, 300);
  appendAudit({
    actor,
    action: 'shiftbid.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateShiftbid(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shiftbid', list);
  appendAudit({ actor, action: 'shiftbid.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shiftbidSummary() {
  const list = listShiftbid();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    awarded: list.filter((x) => x.status === 'awarded').length,
    closed: list.filter((x) => x.status === 'closed').length, shiftbid: list };
}
