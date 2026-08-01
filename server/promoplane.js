/**
 * AŞAMA 653 — Promo Plane.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('promoplane', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prm_1', promo: "August 2+1",
      channel: "Store", status: 'planned', at: new Date().toISOString() }];
    writeCollection('promoplane', seed);
    return seed;
  }
  return list;
}
export function listPromoplane(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPromoplane(input, actor = 'system') {
  const row = {
    id: `prm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    promo: input.promo !== undefined ? input.promo : "August 2+1",
    channel: input.channel !== undefined ? input.channel : "Store",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('promoplane', row, 300);
  appendAudit({
    actor,
    action: 'promoplane.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePromoplane(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('promoplane', list);
  appendAudit({ actor, action: 'promoplane.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function promoplaneSummary() {
  const list = listPromoplane();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    ended: list.filter((x) => x.status === 'ended').length, promoplane: list };
}
