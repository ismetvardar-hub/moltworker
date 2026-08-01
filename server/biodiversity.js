/**
 * AŞAMA 275 — Biyoçeşitlilik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('biodiversity', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bio_1', species: "Caretta",
      note: "Yuva", status: 'observed', at: new Date().toISOString() }];
    writeCollection('biodiversity', seed);
    return seed;
  }
  return list;
}
export function listBiodiversity(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBiodiversity(input, actor = 'system') {
  const row = {
    id: `bio_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    species: input.species !== undefined ? input.species : "Caretta",
    note: input.note !== undefined ? input.note : "Yuva",
    status: input.status || 'observed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('biodiversity', row, 300);
  appendAudit({ actor, action: 'biodiversity.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateBiodiversity(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('biodiversity', list);
  appendAudit({ actor, action: 'biodiversity.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function biodiversitySummary() {
  const list = listBiodiversity();
  return { total: list.length, observed: list.filter((x) => x.status === 'observed').length,
    protected: list.filter((x) => x.status === 'protected').length,
    alert: list.filter((x) => x.status === 'alert').length, biodiversity: list };
}
