/**
 * AŞAMA 631 — Trendyol Bridge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tybridge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tyb_1', sku: "DAZE-TEE-M",
      qty: "24", status: 'queued', at: new Date().toISOString() }];
    writeCollection('tybridge', seed);
    return seed;
  }
  return list;
}
export function listTybridge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTybridge(input, actor = 'system') {
  const row = {
    id: `tyb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "DAZE-TEE-M",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 24,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tybridge', row, 300);
  appendAudit({
    actor,
    action: 'tybridge.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTybridge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tybridge', list);
  appendAudit({ actor, action: 'tybridge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tybridgeSummary() {
  const list = listTybridge();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    pushed: list.filter((x) => x.status === 'pushed').length,
    error: list.filter((x) => x.status === 'error').length,
    synced: list.filter((x) => x.status === 'synced').length, tybridge: list };
}
