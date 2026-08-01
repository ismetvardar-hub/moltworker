/**
 * AŞAMA 325 — Stok Senkron.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('invsync', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ivs_1', sku: "Su",
      channel: "POS", status: 'synced', at: new Date().toISOString() }];
    writeCollection('invsync', seed);
    return seed;
  }
  return list;
}
export function listInvsync(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInvsync(input, actor = 'system') {
  const row = {
    id: `ivs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Su",
    channel: input.channel !== undefined ? input.channel : "POS",
    status: input.status || 'synced',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('invsync', row, 300);
  appendAudit({
    actor,
    action: 'invsync.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInvsync(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('invsync', list);
  appendAudit({ actor, action: 'invsync.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function invsyncSummary() {
  const list = listInvsync();
  return { total: list.length, synced: list.filter((x) => x.status === 'synced').length,
    drift: list.filter((x) => x.status === 'drift').length,
    failed: list.filter((x) => x.status === 'failed').length, invsync: list };
}
