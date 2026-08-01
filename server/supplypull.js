/**
 * AŞAMA 464 — Supply Pull.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('supplypull', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'spl_1', sku: "Olive oil",
      qty: "6", status: 'requested', at: new Date().toISOString() }];
    writeCollection('supplypull', seed);
    return seed;
  }
  return list;
}
export function listSupplypull(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSupplypull(input, actor = 'system') {
  const row = {
    id: `spl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Olive oil",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 6,
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('supplypull', row, 300);
  appendAudit({
    actor,
    action: 'supplypull.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSupplypull(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('supplypull', list);
  appendAudit({ actor, action: 'supplypull.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function supplypullSummary() {
  const list = listSupplypull();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    pulled: list.filter((x) => x.status === 'pulled').length,
    received: list.filter((x) => x.status === 'received').length, supplypull: list };
}
