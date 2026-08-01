/**
 * AŞAMA 326 — Fiyat Push.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pricepush', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prp_1', sku: "Cocktail",
      price: "420", status: 'queued', at: new Date().toISOString() }];
    writeCollection('pricepush', seed);
    return seed;
  }
  return list;
}
export function listPricepush(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPricepush(input, actor = 'system') {
  const row = {
    id: `prp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Cocktail",
    price: input.price !== undefined ? Number(input.price) || 0 : 420,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pricepush', row, 300);
  appendAudit({
    actor,
    action: 'pricepush.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePricepush(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pricepush', list);
  appendAudit({ actor, action: 'pricepush.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pricepushSummary() {
  const list = listPricepush();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    live: list.filter((x) => x.status === 'live').length,
    rolled_back: list.filter((x) => x.status === 'rolled_back').length, pricepush: list };
}
