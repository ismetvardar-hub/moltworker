/**
 * AŞAMA 684 — Offset Buy.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('offsetbuy', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ofb_1', project: "Forest TR",
      tco2e: "50", status: 'ordered', at: new Date().toISOString() }];
    writeCollection('offsetbuy', seed);
    return seed;
  }
  return list;
}
export function listOffsetbuy(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOffsetbuy(input, actor = 'system') {
  const row = {
    id: `ofb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    project: input.project !== undefined ? input.project : "Forest TR",
    tco2e: input.tco2e !== undefined ? Number(input.tco2e) || 0 : 50,
    status: input.status || 'ordered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('offsetbuy', row, 300);
  appendAudit({
    actor,
    action: 'offsetbuy.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOffsetbuy(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('offsetbuy', list);
  appendAudit({ actor, action: 'offsetbuy.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function offsetbuySummary() {
  const list = listOffsetbuy();
  return { total: list.length, ordered: list.filter((x) => x.status === 'ordered').length,
    retired: list.filter((x) => x.status === 'retired').length,
    void: list.filter((x) => x.status === 'void').length, offsetbuy: list };
}
