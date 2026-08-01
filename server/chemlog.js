/**
 * AŞAMA 174 — Kimyasal Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('chemlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'chm_1', pool: "Ana",
      chemical: "Klor", status: 'ok', at: new Date().toISOString() }];
    writeCollection('chemlog', seed);
    return seed;
  }
  return list;
}
export function listChemlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChemlog(input, actor = 'system') {
  const row = {
    id: `chm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pool: input.pool !== undefined ? input.pool : "Ana",
    chemical: input.chemical !== undefined ? input.chemical : "Klor",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('chemlog', row, 300);
  appendAudit({ actor, action: 'chemlog.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateChemlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('chemlog', list);
  appendAudit({ actor, action: 'chemlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function chemlogSummary() {
  const list = listChemlog();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    adjust: list.filter((x) => x.status === 'adjust').length,
    alert: list.filter((x) => x.status === 'alert').length, chemlog: list };
}
