/**
 * AŞAMA 276 — Geri Dönüşüm.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('recycling', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rcy_1', material: "Cam",
      kg: "85", status: 'collected', at: new Date().toISOString() }];
    writeCollection('recycling', seed);
    return seed;
  }
  return list;
}
export function listRecycling(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRecycling(input, actor = 'system') {
  const row = {
    id: `rcy_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    material: input.material !== undefined ? input.material : "Cam",
    kg: input.kg !== undefined ? Number(input.kg) || 0 : 85,
    status: input.status || 'collected',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('recycling', row, 300);
  appendAudit({ actor, action: 'recycling.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateRecycling(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('recycling', list);
  appendAudit({ actor, action: 'recycling.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function recyclingSummary() {
  const list = listRecycling();
  return { total: list.length, collected: list.filter((x) => x.status === 'collected').length,
    shipped: list.filter((x) => x.status === 'shipped').length,
    credited: list.filter((x) => x.status === 'credited').length, recycling: list };
}
