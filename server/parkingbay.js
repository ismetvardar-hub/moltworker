/**
 * AŞAMA 595 — Parking Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('parkingbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pkb_1', bay: "B-14",
      plate: "07 LYK 03", status: 'free', at: new Date().toISOString() }];
    writeCollection('parkingbay', seed);
    return seed;
  }
  return list;
}
export function listParkingbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createParkingbay(input, actor = 'system') {
  const row = {
    id: `pkb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "B-14",
    plate: input.plate !== undefined ? input.plate : "07 LYK 03",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('parkingbay', row, 300);
  appendAudit({
    actor,
    action: 'parkingbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateParkingbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('parkingbay', list);
  appendAudit({ actor, action: 'parkingbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function parkingbaySummary() {
  const list = listParkingbay();
  return { total: list.length, free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    reserved: list.filter((x) => x.status === 'reserved').length, parkingbay: list };
}
