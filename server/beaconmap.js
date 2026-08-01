/**
 * AŞAMA 168 — Beacon Harita.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('beaconmap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bcn_1', beacon: "BC-01",
      zone: "Lobby", status: 'online', at: new Date().toISOString() }];
    writeCollection('beaconmap', seed);
    return seed;
  }
  return list;
}
export function listBeaconmap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBeaconmap(input, actor = 'system') {
  const row = {
    id: `bcn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    beacon: input.beacon !== undefined ? input.beacon : "BC-01",
    zone: input.zone !== undefined ? input.zone : "Lobby",
    status: input.status || 'online',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('beaconmap', row, 300);
  appendAudit({ actor, action: 'beaconmap.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateBeaconmap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('beaconmap', list);
  appendAudit({ actor, action: 'beaconmap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function beaconmapSummary() {
  const list = listBeaconmap();
  return { total: list.length, online: list.filter((x) => x.status === 'online').length,
    lowbatt: list.filter((x) => x.status === 'lowbatt').length,
    offline: list.filter((x) => x.status === 'offline').length, beaconmap: list };
}
