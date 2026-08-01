/**
 * AŞAMA 586 — Shuttle Lane.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shuttlelane', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'shl_1', lane: "Airport",
      depart: "10:30", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('shuttlelane', seed);
    return seed;
  }
  return list;
}
export function listShuttlelane(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShuttlelane(input, actor = 'system') {
  const row = {
    id: `shl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "Airport",
    depart: input.depart !== undefined ? input.depart : "10:30",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shuttlelane', row, 300);
  appendAudit({
    actor,
    action: 'shuttlelane.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateShuttlelane(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shuttlelane', list);
  appendAudit({ actor, action: 'shuttlelane.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shuttlelaneSummary() {
  const list = listShuttlelane();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    boarding: list.filter((x) => x.status === 'boarding').length,
    enroute: list.filter((x) => x.status === 'enroute').length,
    arrived: list.filter((x) => x.status === 'arrived').length, shuttlelane: list };
}
