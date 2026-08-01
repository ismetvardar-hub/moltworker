/**
 * AŞAMA 191 — Poker.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pokertable', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pkr_1', table: "VIP",
      buyin: "500", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('pokertable', seed);
    return seed;
  }
  return list;
}
export function listPokertable(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPokertable(input, actor = 'system') {
  const row = {
    id: `pkr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    table: input.table !== undefined ? input.table : "VIP",
    buyin: input.buyin !== undefined ? Number(input.buyin) || 0 : 500,
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pokertable', row, 300);
  appendAudit({ actor, action: 'pokertable.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updatePokertable(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pokertable', list);
  appendAudit({ actor, action: 'pokertable.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pokertableSummary() {
  const list = listPokertable();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, pokertable: list };
}
