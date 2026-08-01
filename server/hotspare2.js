/**
 * AŞAMA 1045 — Hot Spare.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hotspare2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hot_1', asset: "Alpha",
      status: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('hotspare2', seed);
    return seed;
  }
  return list;
}
export function listHotspare2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHotspare2(input, actor = 'system') {
  const row = {
    id: `hot_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hotspare2', row, 300);
  appendAudit({
    actor,
    action: 'hotspare2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHotspare2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hotspare2', list);
  appendAudit({ actor, action: 'hotspare2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hotspare2Summary() {
  const list = listHotspare2();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, hotspare2: list };
}
