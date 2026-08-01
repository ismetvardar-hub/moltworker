/**
 * AŞAMA 283 — Tedarik Risk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vendorrisk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vrk_1', vendor: "Lojistik",
      score: "72", status: 'low', at: new Date().toISOString() }];
    writeCollection('vendorrisk', seed);
    return seed;
  }
  return list;
}
export function listVendorrisk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVendorrisk(input, actor = 'system') {
  const row = {
    id: `vrk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Lojistik",
    score: input.score !== undefined ? Number(input.score) || 0 : 72,
    status: input.status || 'low',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vendorrisk', row, 300);
  appendAudit({ actor, action: 'vendorrisk.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateVendorrisk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vendorrisk', list);
  appendAudit({ actor, action: 'vendorrisk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vendorriskSummary() {
  const list = listVendorrisk();
  return { total: list.length, low: list.filter((x) => x.status === 'low').length,
    medium: list.filter((x) => x.status === 'medium').length,
    high: list.filter((x) => x.status === 'high').length, vendorrisk: list };
}
