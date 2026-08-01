/**
 * AŞAMA 389 — Promo Attribution.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('promoattr', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pra_1', promo: "LIKYA10",
      orders: "37", status: 'attributed', at: new Date().toISOString() }];
    writeCollection('promoattr', seed);
    return seed;
  }
  return list;
}
export function listPromoattr(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPromoattr(input, actor = 'system') {
  const row = {
    id: `pra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    promo: input.promo !== undefined ? input.promo : "LIKYA10",
    orders: input.orders !== undefined ? Number(input.orders) || 0 : 37,
    status: input.status || 'attributed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('promoattr', row, 300);
  appendAudit({
    actor,
    action: 'promoattr.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePromoattr(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('promoattr', list);
  appendAudit({ actor, action: 'promoattr.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function promoattrSummary() {
  const list = listPromoattr();
  return { total: list.length, attributed: list.filter((x) => x.status === 'attributed').length,
    uncertain: list.filter((x) => x.status === 'uncertain').length, promoattr: list };
}
