/**
 * AŞAMA 421 — Liman Şeridi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('harborlane', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hbl_1', lane: "A",
      traffic: "Light", status: 'open', at: new Date().toISOString() }];
    writeCollection('harborlane', seed);
    return seed;
  }
  return list;
}
export function listHarborlane(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHarborlane(input, actor = 'system') {
  const row = {
    id: `hbl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "A",
    traffic: input.traffic !== undefined ? input.traffic : "Light",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('harborlane', row, 300);
  appendAudit({
    actor,
    action: 'harborlane.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHarborlane(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('harborlane', list);
  appendAudit({ actor, action: 'harborlane.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function harborlaneSummary() {
  const list = listHarborlane();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    congested: list.filter((x) => x.status === 'congested').length,
    closed: list.filter((x) => x.status === 'closed').length, harborlane: list };
}
