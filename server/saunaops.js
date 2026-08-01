/**
 * AŞAMA 176 — Sauna.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('saunaops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sau_1', cabin: "A",
      tempC: "80", status: 'ready', at: new Date().toISOString() }];
    writeCollection('saunaops', seed);
    return seed;
  }
  return list;
}
export function listSaunaops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSaunaops(input, actor = 'system') {
  const row = {
    id: `sau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cabin: input.cabin !== undefined ? input.cabin : "A",
    tempC: input.tempC !== undefined ? Number(input.tempC) || 0 : 80,
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('saunaops', row, 300);
  appendAudit({ actor, action: 'saunaops.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateSaunaops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('saunaops', list);
  appendAudit({ actor, action: 'saunaops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function saunaopsSummary() {
  const list = listSaunaops();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    in_use: list.filter((x) => x.status === 'in_use').length,
    cooldown: list.filter((x) => x.status === 'cooldown').length, saunaops: list };
}
