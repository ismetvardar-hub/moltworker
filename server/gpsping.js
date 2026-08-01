/**
 * AŞAMA 592 — GPS Ping.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('gpsping', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gps_1', vehicle: "Van-3",
      lat: "36.7", status: 'fresh', at: new Date().toISOString() }];
    writeCollection('gpsping', seed);
    return seed;
  }
  return list;
}
export function listGpsping(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGpsping(input, actor = 'system') {
  const row = {
    id: `gps_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vehicle: input.vehicle !== undefined ? input.vehicle : "Van-3",
    lat: input.lat !== undefined ? Number(input.lat) || 0 : 36.7,
    status: input.status || 'fresh',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('gpsping', row, 300);
  appendAudit({
    actor,
    action: 'gpsping.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGpsping(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('gpsping', list);
  appendAudit({ actor, action: 'gpsping.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function gpspingSummary() {
  const list = listGpsping();
  return { total: list.length, fresh: list.filter((x) => x.status === 'fresh').length,
    stale: list.filter((x) => x.status === 'stale').length,
    offline: list.filter((x) => x.status === 'offline').length, gpsping: list };
}
