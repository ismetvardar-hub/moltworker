/**
 * AŞAMA 673 — Asset Lib.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('assetlib', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'asl_1', asset: "Logo pack",
      format: "SVG", status: 'draft', at: new Date().toISOString() }];
    writeCollection('assetlib', seed);
    return seed;
  }
  return list;
}
export function listAssetlib(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAssetlib(input, actor = 'system') {
  const row = {
    id: `asl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Logo pack",
    format: input.format !== undefined ? input.format : "SVG",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('assetlib', row, 300);
  appendAudit({
    actor,
    action: 'assetlib.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAssetlib(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('assetlib', list);
  appendAudit({ actor, action: 'assetlib.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function assetlibSummary() {
  const list = listAssetlib();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    approved: list.filter((x) => x.status === 'approved').length,
    archived: list.filter((x) => x.status === 'archived').length, assetlib: list };
}
