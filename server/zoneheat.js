/**
 * AŞAMA 223 — Zone Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('zoneheat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'zht_1', zone: "Deck",
      score: "78", status: 'cool', at: new Date().toISOString() }];
    writeCollection('zoneheat', seed);
    return seed;
  }
  return list;
}
export function listZoneheat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createZoneheat(input, actor = 'system') {
  const row = {
    id: `zht_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Deck",
    score: input.score !== undefined ? Number(input.score) || 0 : 78,
    status: input.status || 'cool',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('zoneheat', row, 300);
  appendAudit({ actor, action: 'zoneheat.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateZoneheat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('zoneheat', list);
  appendAudit({ actor, action: 'zoneheat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function zoneheatSummary() {
  const list = listZoneheat();
  return { total: list.length, cool: list.filter((x) => x.status === 'cool').length,
    warm: list.filter((x) => x.status === 'warm').length,
    hot: list.filter((x) => x.status === 'hot').length, zoneheat: list };
}
