/**
 * AŞAMA 317 — MINT Fiyat Push.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dynamint', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dmt_1', sku: "Pass-Day",
      price: "1850", status: 'queued', at: new Date().toISOString() }];
    writeCollection('dynamint', seed);
    return seed;
  }
  return list;
}
export function listDynamint(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDynamint(input, actor = 'system') {
  const row = {
    id: `dmt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Pass-Day",
    price: input.price !== undefined ? Number(input.price) || 0 : 1850,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dynamint', row, 300);
  appendAudit({
    actor,
    action: 'dynamint.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDynamint(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dynamint', list);
  appendAudit({ actor, action: 'dynamint.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dynamintSummary() {
  const list = listDynamint();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    pushed: list.filter((x) => x.status === 'pushed').length,
    stale: list.filter((x) => x.status === 'stale').length, dynamint: list };
}
