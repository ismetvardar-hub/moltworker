/**
 * AŞAMA 329 — Hediye Relay.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('giftrelay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gfr_1', gift: "Spa voucher",
      toGuest: "Misafir", status: 'queued', at: new Date().toISOString() }];
    writeCollection('giftrelay', seed);
    return seed;
  }
  return list;
}
export function listGiftrelay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGiftrelay(input, actor = 'system') {
  const row = {
    id: `gfr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gift: input.gift !== undefined ? input.gift : "Spa voucher",
    toGuest: input.toGuest !== undefined ? input.toGuest : "Misafir",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('giftrelay', row, 300);
  appendAudit({
    actor,
    action: 'giftrelay.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGiftrelay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('giftrelay', list);
  appendAudit({ actor, action: 'giftrelay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function giftrelaySummary() {
  const list = listGiftrelay();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    relayed: list.filter((x) => x.status === 'relayed').length,
    delivered: list.filter((x) => x.status === 'delivered').length, giftrelay: list };
}
