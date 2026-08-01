/**
 * AŞAMA 1112 — Calm Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('calmroom3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cal_1', room: "Alpha",
      guestName: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('calmroom3', seed);
    return seed;
  }
  return list;
}
export function listCalmroom3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCalmroom3(input, actor = 'system') {
  const row = {
    id: `cal_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Alpha",
    guestName: input.guestName !== undefined ? input.guestName : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('calmroom3', row, 300);
  appendAudit({
    actor,
    action: 'calmroom3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCalmroom3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('calmroom3', list);
  appendAudit({ actor, action: 'calmroom3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function calmroom3Summary() {
  const list = listCalmroom3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, calmroom3: list };
}
