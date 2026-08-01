/**
 * AŞAMA 580 — Payout.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('payout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pay_1', payee: "Vendor-A",
      amount: "15000", status: 'queued', at: new Date().toISOString() }];
    writeCollection('payout', seed);
    return seed;
  }
  return list;
}
export function listPayout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPayout(input, actor = 'system') {
  const row = {
    id: `pay_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    payee: input.payee !== undefined ? input.payee : "Vendor-A",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 15000,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('payout', row, 300);
  appendAudit({
    actor,
    action: 'payout.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePayout(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('payout', list);
  appendAudit({ actor, action: 'payout.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function payoutSummary() {
  const list = listPayout();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    sent: list.filter((x) => x.status === 'sent').length,
    failed: list.filter((x) => x.status === 'failed').length, payout: list };
}
