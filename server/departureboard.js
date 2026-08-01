/**
 * AŞAMA 625 — Departure Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('departureboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dep_1', room: "412",
      etd: "11:00", status: 'due', at: new Date().toISOString() }];
    writeCollection('departureboard', seed);
    return seed;
  }
  return list;
}
export function listDepartureboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDepartureboard(input, actor = 'system') {
  const row = {
    id: `dep_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    etd: input.etd !== undefined ? input.etd : "11:00",
    status: input.status || 'due',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('departureboard', row, 300);
  appendAudit({
    actor,
    action: 'departureboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDepartureboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('departureboard', list);
  appendAudit({ actor, action: 'departureboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function departureboardSummary() {
  const list = listDepartureboard();
  return { total: list.length, due: list.filter((x) => x.status === 'due').length,
    checked_out: list.filter((x) => x.status === 'checked_out').length,
    extended: list.filter((x) => x.status === 'extended').length, departureboard: list };
}
