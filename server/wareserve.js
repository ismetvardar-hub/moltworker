/**
 * AŞAMA 636 — WA Reserve.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wareserve', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'war_1', guestName: "Misafir",
      channel: "WhatsApp", status: 'pending', at: new Date().toISOString() }];
    writeCollection('wareserve', seed);
    return seed;
  }
  return list;
}
export function listWareserve(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWareserve(input, actor = 'system') {
  const row = {
    id: `war_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    channel: input.channel !== undefined ? input.channel : "WhatsApp",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wareserve', row, 300);
  appendAudit({
    actor,
    action: 'wareserve.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWareserve(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wareserve', list);
  appendAudit({ actor, action: 'wareserve.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wareserveSummary() {
  const list = listWareserve();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    expired: list.filter((x) => x.status === 'expired').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, wareserve: list };
}
