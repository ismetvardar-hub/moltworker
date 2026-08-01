/**
 * AŞAMA 490 — Tenant Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tenantops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tnt_1', tenant: "Boutique",
      request: "AC", status: 'open', at: new Date().toISOString() }];
    writeCollection('tenantops', seed);
    return seed;
  }
  return list;
}
export function listTenantops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTenantops(input, actor = 'system') {
  const row = {
    id: `tnt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tenant: input.tenant !== undefined ? input.tenant : "Boutique",
    request: input.request !== undefined ? input.request : "AC",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tenantops', row, 300);
  appendAudit({
    actor,
    action: 'tenantops.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTenantops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tenantops', list);
  appendAudit({ actor, action: 'tenantops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tenantopsSummary() {
  const list = listTenantops();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    working: list.filter((x) => x.status === 'working').length,
    done: list.filter((x) => x.status === 'done').length, tenantops: list };
}
