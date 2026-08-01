/**
 * AŞAMA 179 — Recovery Slot.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('recovslots', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rcv_1', therapy: "Stretch",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('recovslots', seed);
    return seed;
  }
  return list;
}
export function listRecovslots(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRecovslots(input, actor = 'system') {
  const row = {
    id: `rcv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    therapy: input.therapy !== undefined ? input.therapy : "Stretch",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('recovslots', row, 300);
  appendAudit({ actor, action: 'recovslots.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateRecovslots(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('recovslots', list);
  appendAudit({ actor, action: 'recovslots.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function recovslotsSummary() {
  const list = listRecovslots();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    in_session: list.filter((x) => x.status === 'in_session').length,
    done: list.filter((x) => x.status === 'done').length, recovslots: list };
}
