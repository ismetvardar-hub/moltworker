/**
 * AŞAMA 247 — İade.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('refunds', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rfd_1', guestName: "Misafir",
      amount: "450", status: 'requested', at: new Date().toISOString() }];
    writeCollection('refunds', seed);
    return seed;
  }
  return list;
}
export function listRefunds(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRefunds(input, actor = 'system') {
  const row = {
    id: `rfd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 450,
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('refunds', row, 300);
  appendAudit({ actor, action: 'refunds.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateRefunds(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('refunds', list);
  appendAudit({ actor, action: 'refunds.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function refundsSummary() {
  const list = listRefunds();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    paid: list.filter((x) => x.status === 'paid').length, refunds: list };
}
