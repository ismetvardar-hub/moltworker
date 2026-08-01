/**
 * AŞAMA 178 — Buz Banyo.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('icebath', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ice_1', slot: "09:00",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('icebath', seed);
    return seed;
  }
  return list;
}
export function listIcebath(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIcebath(input, actor = 'system') {
  const row = {
    id: `ice_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "09:00",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('icebath', row, 300);
  appendAudit({ actor, action: 'icebath.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateIcebath(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('icebath', list);
  appendAudit({ actor, action: 'icebath.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function icebathSummary() {
  const list = listIcebath();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    done: list.filter((x) => x.status === 'done').length,
    no_show: list.filter((x) => x.status === 'no_show').length, icebath: list };
}
