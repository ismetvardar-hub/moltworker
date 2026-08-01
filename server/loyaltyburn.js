/**
 * AŞAMA 320 — Sadakat Harcama.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('loyaltyburn', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lbr_1', guestName: "Misafir",
      points: "500", status: 'pending', at: new Date().toISOString() }];
    writeCollection('loyaltyburn', seed);
    return seed;
  }
  return list;
}
export function listLoyaltyburn(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLoyaltyburn(input, actor = 'system') {
  const row = {
    id: `lbr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    points: input.points !== undefined ? Number(input.points) || 0 : 500,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('loyaltyburn', row, 300);
  appendAudit({
    actor,
    action: 'loyaltyburn.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLoyaltyburn(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('loyaltyburn', list);
  appendAudit({ actor, action: 'loyaltyburn.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function loyaltyburnSummary() {
  const list = listLoyaltyburn();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    burned: list.filter((x) => x.status === 'burned').length,
    reversed: list.filter((x) => x.status === 'reversed').length, loyaltyburn: list };
}
