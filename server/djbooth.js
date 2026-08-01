/**
 * AŞAMA 193 — DJ Booth.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('djbooth', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'djb_1', dj: "Resident",
      slot: "22:00", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('djbooth', seed);
    return seed;
  }
  return list;
}
export function listDjbooth(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDjbooth(input, actor = 'system') {
  const row = {
    id: `djb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dj: input.dj !== undefined ? input.dj : "Resident",
    slot: input.slot !== undefined ? input.slot : "22:00",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('djbooth', row, 300);
  appendAudit({ actor, action: 'djbooth.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateDjbooth(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('djbooth', list);
  appendAudit({ actor, action: 'djbooth.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function djboothSummary() {
  const list = listDjbooth();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, djbooth: list };
}
