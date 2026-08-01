/**
 * AŞAMA 242 — AP Ödeme.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('apbill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'apb_1', vendor: "Tedarikçi",
      amount: "8000", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('apbill', seed);
    return seed;
  }
  return list;
}
export function listApbill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createApbill(input, actor = 'system') {
  const row = {
    id: `apb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Tedarikçi",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 8000,
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('apbill', row, 300);
  appendAudit({ actor, action: 'apbill.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateApbill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('apbill', list);
  appendAudit({ actor, action: 'apbill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function apbillSummary() {
  const list = listApbill();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    paid: list.filter((x) => x.status === 'paid').length,
    held: list.filter((x) => x.status === 'held').length, apbill: list };
}
