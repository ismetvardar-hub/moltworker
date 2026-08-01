/**
 * AŞAMA 177 — Steam.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('steamops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stm_1', room: "Steam-1",
      humidity: "90", status: 'ready', at: new Date().toISOString() }];
    writeCollection('steamops', seed);
    return seed;
  }
  return list;
}
export function listSteamops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSteamops(input, actor = 'system') {
  const row = {
    id: `stm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Steam-1",
    humidity: input.humidity !== undefined ? Number(input.humidity) || 0 : 90,
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('steamops', row, 300);
  appendAudit({ actor, action: 'steamops.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateSteamops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('steamops', list);
  appendAudit({ actor, action: 'steamops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function steamopsSummary() {
  const list = listSteamops();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    in_use: list.filter((x) => x.status === 'in_use').length,
    service: list.filter((x) => x.status === 'service').length, steamops: list };
}
