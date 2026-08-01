/**
 * AŞAMA 181 — Helipad.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('helipad', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hel_1', slot: "H1",
      flight: "VIP-01", status: 'open', at: new Date().toISOString() }];
    writeCollection('helipad', seed);
    return seed;
  }
  return list;
}
export function listHelipad(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHelipad(input, actor = 'system') {
  const row = {
    id: `hel_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "H1",
    flight: input.flight !== undefined ? input.flight : "VIP-01",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('helipad', row, 300);
  appendAudit({ actor, action: 'helipad.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateHelipad(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('helipad', list);
  appendAudit({ actor, action: 'helipad.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function helipadSummary() {
  const list = listHelipad();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    booked: list.filter((x) => x.status === 'booked').length,
    closed: list.filter((x) => x.status === 'closed').length, helipad: list };
}
