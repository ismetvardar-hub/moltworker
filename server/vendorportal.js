/**
 * AŞAMA 651 — Vendor Portal.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vendorportal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vnp_1', vendor: "Local mill",
      po: "PO-440", status: 'open', at: new Date().toISOString() }];
    writeCollection('vendorportal', seed);
    return seed;
  }
  return list;
}
export function listVendorportal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVendorportal(input, actor = 'system') {
  const row = {
    id: `vnp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Local mill",
    po: input.po !== undefined ? input.po : "PO-440",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vendorportal', row, 300);
  appendAudit({
    actor,
    action: 'vendorportal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVendorportal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vendorportal', list);
  appendAudit({ actor, action: 'vendorportal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vendorportalSummary() {
  const list = listVendorportal();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    acked: list.filter((x) => x.status === 'acked').length,
    shipped: list.filter((x) => x.status === 'shipped').length, vendorportal: list };
}
