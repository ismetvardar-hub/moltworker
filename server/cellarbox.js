/**
 * AŞAMA 457 — Cellar Box.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cellarbox', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clb_1', bin: "B-12",
      sku: "Chardonnay", status: 'stocked', at: new Date().toISOString() }];
    writeCollection('cellarbox', seed);
    return seed;
  }
  return list;
}
export function listCellarbox(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCellarbox(input, actor = 'system') {
  const row = {
    id: `clb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bin: input.bin !== undefined ? input.bin : "B-12",
    sku: input.sku !== undefined ? input.sku : "Chardonnay",
    status: input.status || 'stocked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cellarbox', row, 300);
  appendAudit({
    actor,
    action: 'cellarbox.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCellarbox(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cellarbox', list);
  appendAudit({ actor, action: 'cellarbox.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cellarboxSummary() {
  const list = listCellarbox();
  return { total: list.length, stocked: list.filter((x) => x.status === 'stocked').length,
    low: list.filter((x) => x.status === 'low').length,
    empty: list.filter((x) => x.status === 'empty').length, cellarbox: list };
}
