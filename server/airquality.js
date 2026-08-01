/**
 * AŞAMA 273 — Hava Kalite.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('airquality', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'air_1', zone: "Lobby",
      aqi: "42", status: 'good', at: new Date().toISOString() }];
    writeCollection('airquality', seed);
    return seed;
  }
  return list;
}
export function listAirquality(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAirquality(input, actor = 'system') {
  const row = {
    id: `air_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Lobby",
    aqi: input.aqi !== undefined ? Number(input.aqi) || 0 : 42,
    status: input.status || 'good',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('airquality', row, 300);
  appendAudit({ actor, action: 'airquality.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateAirquality(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('airquality', list);
  appendAudit({ actor, action: 'airquality.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function airqualitySummary() {
  const list = listAirquality();
  return { total: list.length, good: list.filter((x) => x.status === 'good').length,
    moderate: list.filter((x) => x.status === 'moderate').length,
    poor: list.filter((x) => x.status === 'poor').length, airquality: list };
}
