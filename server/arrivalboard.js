/**
 * AŞAMA 624 — Arrival Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('arrivalboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'arv_1', guestName: "Misafir",
      eta: "15:00", status: 'expected', at: new Date().toISOString() }];
    writeCollection('arrivalboard', seed);
    return seed;
  }
  return list;
}
export function listArrivalboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArrivalboard(input, actor = 'system') {
  const row = {
    id: `arv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    eta: input.eta !== undefined ? input.eta : "15:00",
    status: input.status || 'expected',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('arrivalboard', row, 300);
  appendAudit({
    actor,
    action: 'arrivalboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateArrivalboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('arrivalboard', list);
  appendAudit({ actor, action: 'arrivalboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function arrivalboardSummary() {
  const list = listArrivalboard();
  return { total: list.length, expected: list.filter((x) => x.status === 'expected').length,
    arrived: list.filter((x) => x.status === 'arrived').length,
    no_show: list.filter((x) => x.status === 'no_show').length, arrivalboard: list };
}
