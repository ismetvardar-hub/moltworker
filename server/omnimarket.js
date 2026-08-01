/**
 * AŞAMA 322 — Omni Market.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('omnimarket', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'omk_1', sku: "Şapka",
      channel: "App", status: 'listed', at: new Date().toISOString() }];
    writeCollection('omnimarket', seed);
    return seed;
  }
  return list;
}
export function listOmnimarket(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOmnimarket(input, actor = 'system') {
  const row = {
    id: `omk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Şapka",
    channel: input.channel !== undefined ? input.channel : "App",
    status: input.status || 'listed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('omnimarket', row, 300);
  appendAudit({
    actor,
    action: 'omnimarket.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOmnimarket(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('omnimarket', list);
  appendAudit({ actor, action: 'omnimarket.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function omnimarketSummary() {
  const list = listOmnimarket();
  return { total: list.length, listed: list.filter((x) => x.status === 'listed').length,
    paused: list.filter((x) => x.status === 'paused').length,
    soldout: list.filter((x) => x.status === 'soldout').length, omnimarket: list };
}
