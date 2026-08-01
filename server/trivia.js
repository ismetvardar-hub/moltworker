/**
 * AŞAMA 192 — Trivia.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('trivia', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trv_1', theme: "Likya",
      teams: "12", status: 'planned', at: new Date().toISOString() }];
    writeCollection('trivia', seed);
    return seed;
  }
  return list;
}
export function listTrivia(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTrivia(input, actor = 'system') {
  const row = {
    id: `trv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    theme: input.theme !== undefined ? input.theme : "Likya",
    teams: input.teams !== undefined ? Number(input.teams) || 0 : 12,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('trivia', row, 300);
  appendAudit({ actor, action: 'trivia.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateTrivia(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('trivia', list);
  appendAudit({ actor, action: 'trivia.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function triviaSummary() {
  const list = listTrivia();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    scored: list.filter((x) => x.status === 'scored').length, trivia: list };
}
