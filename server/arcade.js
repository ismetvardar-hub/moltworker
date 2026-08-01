/**
 * AŞAMA 188 — Arcade.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('arcade', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'arc_1', machine: "AirHockey",
      credits: "10", status: 'ok', at: new Date().toISOString() }];
    writeCollection('arcade', seed);
    return seed;
  }
  return list;
}
export function listArcade(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArcade(input, actor = 'system') {
  const row = {
    id: `arc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    machine: input.machine !== undefined ? input.machine : "AirHockey",
    credits: input.credits !== undefined ? Number(input.credits) || 0 : 10,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('arcade', row, 300);
  appendAudit({ actor, action: 'arcade.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateArcade(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('arcade', list);
  appendAudit({ actor, action: 'arcade.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function arcadeSummary() {
  const list = listArcade();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    fault: list.filter((x) => x.status === 'fault').length,
    offline: list.filter((x) => x.status === 'offline').length, arcade: list };
}
