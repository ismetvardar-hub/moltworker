/**
 * AŞAMA 640 — Sport Slot.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sportslot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sps_1', court: "Tennis-1",
      slot: "09:00", status: 'open', at: new Date().toISOString() }];
    writeCollection('sportslot', seed);
    return seed;
  }
  return list;
}
export function listSportslot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSportslot(input, actor = 'system') {
  const row = {
    id: `sps_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    court: input.court !== undefined ? input.court : "Tennis-1",
    slot: input.slot !== undefined ? input.slot : "09:00",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sportslot', row, 300);
  appendAudit({
    actor,
    action: 'sportslot.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSportslot(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sportslot', list);
  appendAudit({ actor, action: 'sportslot.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sportslotSummary() {
  const list = listSportslot();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    booked: list.filter((x) => x.status === 'booked').length,
    live: list.filter((x) => x.status === 'live').length,
    closed: list.filter((x) => x.status === 'closed').length, sportslot: list };
}
