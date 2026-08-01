/**
 * AŞAMA 189 — Bowling.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bowling', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bwl_1', lane: "3",
      guestName: "Misafir", status: 'open', at: new Date().toISOString() }];
    writeCollection('bowling', seed);
    return seed;
  }
  return list;
}
export function listBowling(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBowling(input, actor = 'system') {
  const row = {
    id: `bwl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "3",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bowling', row, 300);
  appendAudit({ actor, action: 'bowling.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateBowling(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bowling', list);
  appendAudit({ actor, action: 'bowling.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bowlingSummary() {
  const list = listBowling();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    playing: list.filter((x) => x.status === 'playing').length,
    closed: list.filter((x) => x.status === 'closed').length, bowling: list };
}
