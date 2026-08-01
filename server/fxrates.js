/**
 * AŞAMA 244 — Döviz Kur.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('fxrates', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fxr_1', pair: "USD/TRY",
      rate: "34.5", status: 'live', at: new Date().toISOString() }];
    writeCollection('fxrates', seed);
    return seed;
  }
  return list;
}
export function listFxrates(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFxrates(input, actor = 'system') {
  const row = {
    id: `fxr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pair: input.pair !== undefined ? input.pair : "USD/TRY",
    rate: input.rate !== undefined ? Number(input.rate) || 0 : 34.5,
    status: input.status || 'live',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fxrates', row, 300);
  appendAudit({ actor, action: 'fxrates.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateFxrates(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fxrates', list);
  appendAudit({ actor, action: 'fxrates.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function fxratesSummary() {
  const list = listFxrates();
  return { total: list.length, live: list.filter((x) => x.status === 'live').length,
    stale: list.filter((x) => x.status === 'stale').length, fxrates: list };
}
