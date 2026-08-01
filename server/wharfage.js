/**
 * AŞAMA 433 — Wharfage.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wharfage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'whf_1', berth: "B-04",
      amount: "1500", status: 'accrued', at: new Date().toISOString() }];
    writeCollection('wharfage', seed);
    return seed;
  }
  return list;
}
export function listWharfage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWharfage(input, actor = 'system') {
  const row = {
    id: `whf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    berth: input.berth !== undefined ? input.berth : "B-04",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 1500,
    status: input.status || 'accrued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wharfage', row, 300);
  appendAudit({
    actor,
    action: 'wharfage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWharfage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wharfage', list);
  appendAudit({ actor, action: 'wharfage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wharfageSummary() {
  const list = listWharfage();
  return { total: list.length, accrued: list.filter((x) => x.status === 'accrued').length,
    billed: list.filter((x) => x.status === 'billed').length,
    paid: list.filter((x) => x.status === 'paid').length, wharfage: list };
}
