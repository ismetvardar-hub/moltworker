/**
 * AŞAMA 481 — Asset Map.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('assetmap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'asm_1', asset: "Chiller-2",
      zone: "Plant", status: 'active', at: new Date().toISOString() }];
    writeCollection('assetmap', seed);
    return seed;
  }
  return list;
}
export function listAssetmap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAssetmap(input, actor = 'system') {
  const row = {
    id: `asm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Chiller-2",
    zone: input.zone !== undefined ? input.zone : "Plant",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('assetmap', row, 300);
  appendAudit({
    actor,
    action: 'assetmap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAssetmap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('assetmap', list);
  appendAudit({ actor, action: 'assetmap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function assetmapSummary() {
  const list = listAssetmap();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    idle: list.filter((x) => x.status === 'idle').length,
    retired: list.filter((x) => x.status === 'retired').length, assetmap: list };
}
