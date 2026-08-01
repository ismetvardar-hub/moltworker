/**
 * AŞAMA 602 — HK Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hkboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hkb_1', room: "412",
      attendant: "Ayşe", status: 'queued', at: new Date().toISOString() }];
    writeCollection('hkboard', seed);
    return seed;
  }
  return list;
}
export function listHkboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHkboard(input, actor = 'system') {
  const row = {
    id: `hkb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    attendant: input.attendant !== undefined ? input.attendant : "Ayşe",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hkboard', row, 300);
  appendAudit({
    actor,
    action: 'hkboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHkboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hkboard', list);
  appendAudit({ actor, action: 'hkboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hkboardSummary() {
  const list = listHkboard();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    cleaning: list.filter((x) => x.status === 'cleaning').length,
    done: list.filter((x) => x.status === 'done').length, hkboard: list };
}
