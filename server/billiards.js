/**
 * AŞAMA 190 — Bilardo.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('billiards', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bil_1', table: "T1",
      guestName: "Misafir", status: 'free', at: new Date().toISOString() }];
    writeCollection('billiards', seed);
    return seed;
  }
  return list;
}
export function listBilliards(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBilliards(input, actor = 'system') {
  const row = {
    id: `bil_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    table: input.table !== undefined ? input.table : "T1",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('billiards', row, 300);
  appendAudit({ actor, action: 'billiards.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateBilliards(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('billiards', list);
  appendAudit({ actor, action: 'billiards.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function billiardsSummary() {
  const list = listBilliards();
  return { total: list.length, free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    hold: list.filter((x) => x.status === 'hold').length, billiards: list };
}
