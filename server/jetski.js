/**
 * AŞAMA 182 — Jet Ski.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('jetski', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'jet_1', unit: "JS-01",
      guestName: "Misafir", status: 'available', at: new Date().toISOString() }];
    writeCollection('jetski', seed);
    return seed;
  }
  return list;
}
export function listJetski(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createJetski(input, actor = 'system') {
  const row = {
    id: `jet_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "JS-01",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'available',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('jetski', row, 300);
  appendAudit({ actor, action: 'jetski.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateJetski(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('jetski', list);
  appendAudit({ actor, action: 'jetski.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function jetskiSummary() {
  const list = listJetski();
  return { total: list.length, available: list.filter((x) => x.status === 'available').length,
    rented: list.filter((x) => x.status === 'rented').length,
    service: list.filter((x) => x.status === 'service').length, jetski: list };
}
