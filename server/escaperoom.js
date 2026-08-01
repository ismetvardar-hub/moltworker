/**
 * AŞAMA 187 — Escape Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('escaperoom', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'esc_1', room: "Phaselis",
      pax: "4", status: 'booked', at: new Date().toISOString() }];
    writeCollection('escaperoom', seed);
    return seed;
  }
  return list;
}
export function listEscaperoom(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEscaperoom(input, actor = 'system') {
  const row = {
    id: `esc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Phaselis",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 4,
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('escaperoom', row, 300);
  appendAudit({ actor, action: 'escaperoom.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateEscaperoom(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('escaperoom', list);
  appendAudit({ actor, action: 'escaperoom.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function escaperoomSummary() {
  const list = listEscaperoom();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, escaperoom: list };
}
