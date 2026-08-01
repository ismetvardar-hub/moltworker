/**
 * AŞAMA 571 — Treasury.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('treasury', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trs_1', account: "Ops TRY",
      balance: "2400000", status: 'ok', at: new Date().toISOString() }];
    writeCollection('treasury', seed);
    return seed;
  }
  return list;
}
export function listTreasury(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTreasury(input, actor = 'system') {
  const row = {
    id: `trs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    account: input.account !== undefined ? input.account : "Ops TRY",
    balance: input.balance !== undefined ? Number(input.balance) || 0 : 2400000,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('treasury', row, 300);
  appendAudit({
    actor,
    action: 'treasury.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTreasury(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('treasury', list);
  appendAudit({ actor, action: 'treasury.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function treasurySummary() {
  const list = listTreasury();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    tight: list.filter((x) => x.status === 'tight').length,
    critical: list.filter((x) => x.status === 'critical').length, treasury: list };
}
