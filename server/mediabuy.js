/**
 * AŞAMA 568 — Media Buy.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mediabuy', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mdb_1', channel: "Meta",
      amount: "12000", status: 'planned', at: new Date().toISOString() }];
    writeCollection('mediabuy', seed);
    return seed;
  }
  return list;
}
export function listMediabuy(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMediabuy(input, actor = 'system') {
  const row = {
    id: `mdb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Meta",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 12000,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mediabuy', row, 300);
  appendAudit({
    actor,
    action: 'mediabuy.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMediabuy(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mediabuy', list);
  appendAudit({ actor, action: 'mediabuy.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mediabuySummary() {
  const list = listMediabuy();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    spent: list.filter((x) => x.status === 'spent').length,
    paused: list.filter((x) => x.status === 'paused').length, mediabuy: list };
}
