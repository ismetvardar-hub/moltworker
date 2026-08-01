/**
 * AŞAMA 224 — Rev Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('revpulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rvp_1', metric: "F&B",
      value: "42000", status: 'live', at: new Date().toISOString() }];
    writeCollection('revpulse', seed);
    return seed;
  }
  return list;
}
export function listRevpulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRevpulse(input, actor = 'system') {
  const row = {
    id: `rvp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "F&B",
    value: input.value !== undefined ? Number(input.value) || 0 : 42000,
    status: input.status || 'live',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('revpulse', row, 300);
  appendAudit({ actor, action: 'revpulse.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateRevpulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('revpulse', list);
  appendAudit({ actor, action: 'revpulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function revpulseSummary() {
  const list = listRevpulse();
  return { total: list.length, live: list.filter((x) => x.status === 'live').length,
    locked: list.filter((x) => x.status === 'locked').length, revpulse: list };
}
