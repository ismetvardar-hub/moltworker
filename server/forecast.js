/**
 * AŞAMA 146 — Gelir Forecast.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('forecast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fcr_1', metric: "RevPAR",
      value: "1850", status: 'draft', at: new Date().toISOString() }];
    writeCollection('forecast', seed);
    return seed;
  }
  return list;
}
export function listForecast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createForecast(input, actor = 'system') {
  const row = {
    id: `fcr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "RevPAR",
    value: input.value !== undefined ? Number(input.value) || 0 : 1850,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('forecast', row, 300);
  appendAudit({ actor, action: 'forecast.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateForecast(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('forecast', list);
  appendAudit({ actor, action: 'forecast.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function forecastSummary() {
  const list = listForecast();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    locked: list.filter((x) => x.status === 'locked').length, forecast: list };
}
