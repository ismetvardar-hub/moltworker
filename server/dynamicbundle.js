/**
 * AŞAMA 379 — Dinamik Bundle.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dynamicbundle', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dbn_1', bundle: "Spa+Dinner",
      price: "3200", status: 'offered', at: new Date().toISOString() }];
    writeCollection('dynamicbundle', seed);
    return seed;
  }
  return list;
}
export function listDynamicbundle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDynamicbundle(input, actor = 'system') {
  const row = {
    id: `dbn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bundle: input.bundle !== undefined ? input.bundle : "Spa+Dinner",
    price: input.price !== undefined ? Number(input.price) || 0 : 3200,
    status: input.status || 'offered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dynamicbundle', row, 300);
  appendAudit({
    actor,
    action: 'dynamicbundle.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDynamicbundle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dynamicbundle', list);
  appendAudit({ actor, action: 'dynamicbundle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dynamicbundleSummary() {
  const list = listDynamicbundle();
  return { total: list.length, offered: list.filter((x) => x.status === 'offered').length,
    sold: list.filter((x) => x.status === 'sold').length,
    expired: list.filter((x) => x.status === 'expired').length, dynamicbundle: list };
}
