/**
 * AŞAMA 489 — Leasehold.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('leasehold', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lsh_1', unit: "Retail-3",
      tenant: "Boutique", status: 'active', at: new Date().toISOString() }];
    writeCollection('leasehold', seed);
    return seed;
  }
  return list;
}
export function listLeasehold(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLeasehold(input, actor = 'system') {
  const row = {
    id: `lsh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "Retail-3",
    tenant: input.tenant !== undefined ? input.tenant : "Boutique",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('leasehold', row, 300);
  appendAudit({
    actor,
    action: 'leasehold.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLeasehold(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('leasehold', list);
  appendAudit({ actor, action: 'leasehold.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function leaseholdSummary() {
  const list = listLeasehold();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    notice: list.filter((x) => x.status === 'notice').length,
    vacant: list.filter((x) => x.status === 'vacant').length, leasehold: list };
}
