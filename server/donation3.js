/**
 * AŞAMA 1150 — Donation.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('donation3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'don_1', donor: "Alpha",
      amount: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('donation3', seed);
    return seed;
  }
  return list;
}
export function listDonation3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDonation3(input, actor = 'system') {
  const row = {
    id: `don_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    donor: input.donor !== undefined ? input.donor : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('donation3', row, 300);
  appendAudit({
    actor,
    action: 'donation3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDonation3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('donation3', list);
  appendAudit({ actor, action: 'donation3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function donation3Summary() {
  const list = listDonation3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, donation3: list };
}
