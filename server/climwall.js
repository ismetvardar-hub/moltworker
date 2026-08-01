/**
 * AŞAMA 186 — Tırmanma.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('climwall', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clm_1', lane: "A",
      guestName: "Misafir", status: 'open', at: new Date().toISOString() }];
    writeCollection('climwall', seed);
    return seed;
  }
  return list;
}
export function listClimwall(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClimwall(input, actor = 'system') {
  const row = {
    id: `clm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "A",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('climwall', row, 300);
  appendAudit({ actor, action: 'climwall.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateClimwall(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('climwall', list);
  appendAudit({ actor, action: 'climwall.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function climwallSummary() {
  const list = listClimwall();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    in_use: list.filter((x) => x.status === 'in_use').length,
    closed: list.filter((x) => x.status === 'closed').length, climwall: list };
}
