/**
 * AŞAMA 274 — Güneş Enerji.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('solarops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'slr_1', array: "Roof-A",
      kwh: "380", status: 'online', at: new Date().toISOString() }];
    writeCollection('solarops', seed);
    return seed;
  }
  return list;
}
export function listSolarops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSolarops(input, actor = 'system') {
  const row = {
    id: `slr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    array: input.array !== undefined ? input.array : "Roof-A",
    kwh: input.kwh !== undefined ? Number(input.kwh) || 0 : 380,
    status: input.status || 'online',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('solarops', row, 300);
  appendAudit({ actor, action: 'solarops.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateSolarops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('solarops', list);
  appendAudit({ actor, action: 'solarops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function solaropsSummary() {
  const list = listSolarops();
  return { total: list.length, online: list.filter((x) => x.status === 'online').length,
    derated: list.filter((x) => x.status === 'derated').length,
    offline: list.filter((x) => x.status === 'offline').length, solarops: list };
}
