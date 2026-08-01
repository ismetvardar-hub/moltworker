/**
 * AŞAMA 649 — Price Audit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('priceaudit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pra_1', sku: "DAZE-TEE",
      delta: "0", status: 'match', at: new Date().toISOString() }];
    writeCollection('priceaudit', seed);
    return seed;
  }
  return list;
}
export function listPriceaudit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPriceaudit(input, actor = 'system') {
  const row = {
    id: `pra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "DAZE-TEE",
    delta: input.delta !== undefined ? Number(input.delta) || 0 : 0,
    status: input.status || 'match',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('priceaudit', row, 300);
  appendAudit({
    actor,
    action: 'priceaudit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePriceaudit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('priceaudit', list);
  appendAudit({ actor, action: 'priceaudit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function priceauditSummary() {
  const list = listPriceaudit();
  return { total: list.length, match: list.filter((x) => x.status === 'match').length,
    mismatch: list.filter((x) => x.status === 'mismatch').length,
    fixed: list.filter((x) => x.status === 'fixed').length, priceaudit: list };
}
