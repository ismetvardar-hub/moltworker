/**
 * AŞAMA 516 — Aid Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('aidkit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aid_1', kit: "Lobby",
      stock: "OK", status: 'ok', at: new Date().toISOString() }];
    writeCollection('aidkit', seed);
    return seed;
  }
  return list;
}
export function listAidkit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAidkit(input, actor = 'system') {
  const row = {
    id: `aid_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    kit: input.kit !== undefined ? input.kit : "Lobby",
    stock: input.stock !== undefined ? input.stock : "OK",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('aidkit', row, 300);
  appendAudit({
    actor,
    action: 'aidkit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAidkit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('aidkit', list);
  appendAudit({ actor, action: 'aidkit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function aidkitSummary() {
  const list = listAidkit();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    expire: list.filter((x) => x.status === 'expire').length, aidkit: list };
}
