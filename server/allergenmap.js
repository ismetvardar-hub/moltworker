/**
 * AŞAMA 461 — Allergen Map.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('allergenmap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'alg_1', guestName: "Misafir",
      flag: "Nuts", status: 'active', at: new Date().toISOString() }];
    writeCollection('allergenmap', seed);
    return seed;
  }
  return list;
}
export function listAllergenmap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAllergenmap(input, actor = 'system') {
  const row = {
    id: `alg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    flag: input.flag !== undefined ? input.flag : "Nuts",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('allergenmap', row, 300);
  appendAudit({
    actor,
    action: 'allergenmap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAllergenmap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('allergenmap', list);
  appendAudit({ actor, action: 'allergenmap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function allergenmapSummary() {
  const list = listAllergenmap();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    cleared: list.filter((x) => x.status === 'cleared').length, allergenmap: list };
}
