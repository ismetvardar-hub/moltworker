/**
 * AŞAMA 462 — Kitchen Waste.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wastekitchen', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wsk_1', station: "Hot",
      kg: "1.2", status: 'logged', at: new Date().toISOString() }];
    writeCollection('wastekitchen', seed);
    return seed;
  }
  return list;
}
export function listWastekitchen(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWastekitchen(input, actor = 'system') {
  const row = {
    id: `wsk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    station: input.station !== undefined ? input.station : "Hot",
    kg: input.kg !== undefined ? Number(input.kg) || 0 : 1.2,
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wastekitchen', row, 300);
  appendAudit({
    actor,
    action: 'wastekitchen.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWastekitchen(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wastekitchen', list);
  appendAudit({ actor, action: 'wastekitchen.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wastekitchenSummary() {
  const list = listWastekitchen();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    reviewed: list.filter((x) => x.status === 'reviewed').length, wastekitchen: list };
}
