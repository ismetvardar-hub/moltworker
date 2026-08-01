/**
 * AŞAMA 619 — Wake All.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wakeall', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wak_1', room: "412",
      time: "07:00", status: 'set', at: new Date().toISOString() }];
    writeCollection('wakeall', seed);
    return seed;
  }
  return list;
}
export function listWakeall(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWakeall(input, actor = 'system') {
  const row = {
    id: `wak_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    time: input.time !== undefined ? input.time : "07:00",
    status: input.status || 'set',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wakeall', row, 300);
  appendAudit({
    actor,
    action: 'wakeall.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWakeall(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wakeall', list);
  appendAudit({ actor, action: 'wakeall.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wakeallSummary() {
  const list = listWakeall();
  return { total: list.length, set: list.filter((x) => x.status === 'set').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    missed: list.filter((x) => x.status === 'missed').length, wakeall: list };
}
