/**
 * AŞAMA 167 — Wayfinding.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wayfind', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wfd_1', point: "Beach Gate",
      label: "Sahil", status: 'active', at: new Date().toISOString() }];
    writeCollection('wayfind', seed);
    return seed;
  }
  return list;
}
export function listWayfind(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWayfind(input, actor = 'system') {
  const row = {
    id: `wfd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    point: input.point !== undefined ? input.point : "Beach Gate",
    label: input.label !== undefined ? input.label : "Sahil",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wayfind', row, 300);
  appendAudit({ actor, action: 'wayfind.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateWayfind(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wayfind', list);
  appendAudit({ actor, action: 'wayfind.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wayfindSummary() {
  const list = listWayfind();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    moved: list.filter((x) => x.status === 'moved').length,
    offline: list.filter((x) => x.status === 'offline').length, wayfind: list };
}
