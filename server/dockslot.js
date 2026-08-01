/**
 * AŞAMA 422 — Rıhtım Slot.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dockslot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dck_1', berth: "B-04",
      vessel: "Supply-1", status: 'free', at: new Date().toISOString() }];
    writeCollection('dockslot', seed);
    return seed;
  }
  return list;
}
export function listDockslot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDockslot(input, actor = 'system') {
  const row = {
    id: `dck_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    berth: input.berth !== undefined ? input.berth : "B-04",
    vessel: input.vessel !== undefined ? input.vessel : "Supply-1",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dockslot', row, 300);
  appendAudit({
    actor,
    action: 'dockslot.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDockslot(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dockslot', list);
  appendAudit({ actor, action: 'dockslot.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dockslotSummary() {
  const list = listDockslot();
  return { total: list.length, free: list.filter((x) => x.status === 'free').length,
    reserved: list.filter((x) => x.status === 'reserved').length,
    occupied: list.filter((x) => x.status === 'occupied').length, dockslot: list };
}
