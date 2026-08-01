/**
 * AŞAMA 271 — Karbon Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('carbonlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cbn_1', source: "Jeneratör",
      tco2e: "1.2", status: 'logged', at: new Date().toISOString() }];
    writeCollection('carbonlog', seed);
    return seed;
  }
  return list;
}
export function listCarbonlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCarbonlog(input, actor = 'system') {
  const row = {
    id: `cbn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    source: input.source !== undefined ? input.source : "Jeneratör",
    tco2e: input.tco2e !== undefined ? Number(input.tco2e) || 0 : 1.2,
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('carbonlog', row, 300);
  appendAudit({ actor, action: 'carbonlog.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateCarbonlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('carbonlog', list);
  appendAudit({ actor, action: 'carbonlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function carbonlogSummary() {
  const list = listCarbonlog();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    verified: list.filter((x) => x.status === 'verified').length, carbonlog: list };
}
