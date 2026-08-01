/**
 * AŞAMA 632 — Dolap List.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dolaplist', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dlp_1', sku: "RE-BAG-01",
      price: "890", status: 'draft', at: new Date().toISOString() }];
    writeCollection('dolaplist', seed);
    return seed;
  }
  return list;
}
export function listDolaplist(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDolaplist(input, actor = 'system') {
  const row = {
    id: `dlp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "RE-BAG-01",
    price: input.price !== undefined ? Number(input.price) || 0 : 890,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dolaplist', row, 300);
  appendAudit({
    actor,
    action: 'dolaplist.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDolaplist(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dolaplist', list);
  appendAudit({ actor, action: 'dolaplist.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dolaplistSummary() {
  const list = listDolaplist();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    listed: list.filter((x) => x.status === 'listed').length,
    sold: list.filter((x) => x.status === 'sold').length,
    delisted: list.filter((x) => x.status === 'delisted').length, dolaplist: list };
}
