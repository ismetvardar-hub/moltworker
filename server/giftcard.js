/**
 * AŞAMA 546 — Gift Card.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('giftcard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gfc_1', code: "LYK-88",
      balance: "1500", status: 'active', at: new Date().toISOString() }];
    writeCollection('giftcard', seed);
    return seed;
  }
  return list;
}
export function listGiftcard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGiftcard(input, actor = 'system') {
  const row = {
    id: `gfc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "LYK-88",
    balance: input.balance !== undefined ? Number(input.balance) || 0 : 1500,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('giftcard', row, 300);
  appendAudit({
    actor,
    action: 'giftcard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGiftcard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('giftcard', list);
  appendAudit({ actor, action: 'giftcard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function giftcardSummary() {
  const list = listGiftcard();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    redeemed: list.filter((x) => x.status === 'redeemed').length,
    void: list.filter((x) => x.status === 'void').length, giftcard: list };
}
