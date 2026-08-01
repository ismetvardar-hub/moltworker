/**
 * AŞAMA 500 — Training Hub.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('traininghub', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trh_1', course: "Guest empathy",
      seats: "16", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('traininghub', seed);
    return seed;
  }
  return list;
}
export function listTraininghub(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTraininghub(input, actor = 'system') {
  const row = {
    id: `trh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    course: input.course !== undefined ? input.course : "Guest empathy",
    seats: input.seats !== undefined ? Number(input.seats) || 0 : 16,
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('traininghub', row, 300);
  appendAudit({
    actor,
    action: 'traininghub.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTraininghub(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('traininghub', list);
  appendAudit({ actor, action: 'traininghub.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function traininghubSummary() {
  const list = listTraininghub();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, traininghub: list };
}
