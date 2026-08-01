/**
 * AŞAMA 610 — VIP Prep.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vipprep', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vpp_1', room: "Suite-1",
      amenity: "Fruit", status: 'staged', at: new Date().toISOString() }];
    writeCollection('vipprep', seed);
    return seed;
  }
  return list;
}
export function listVipprep(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVipprep(input, actor = 'system') {
  const row = {
    id: `vpp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Suite-1",
    amenity: input.amenity !== undefined ? input.amenity : "Fruit",
    status: input.status || 'staged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vipprep', row, 300);
  appendAudit({
    actor,
    action: 'vipprep.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVipprep(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vipprep', list);
  appendAudit({ actor, action: 'vipprep.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vipprepSummary() {
  const list = listVipprep();
  return { total: list.length, staged: list.filter((x) => x.status === 'staged').length,
    set: list.filter((x) => x.status === 'set').length,
    checked: list.filter((x) => x.status === 'checked').length, vipprep: list };
}
