/**
 * AŞAMA 484 — Water Loop.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('waterloop', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wtl_1', loop: "Domestic",
      bar: "3.2", status: 'ok', at: new Date().toISOString() }];
    writeCollection('waterloop', seed);
    return seed;
  }
  return list;
}
export function listWaterloop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWaterloop(input, actor = 'system') {
  const row = {
    id: `wtl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    loop: input.loop !== undefined ? input.loop : "Domestic",
    bar: input.bar !== undefined ? Number(input.bar) || 0 : 3.2,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('waterloop', row, 300);
  appendAudit({
    actor,
    action: 'waterloop.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWaterloop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('waterloop', list);
  appendAudit({ actor, action: 'waterloop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function waterloopSummary() {
  const list = listWaterloop();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    alarm: list.filter((x) => x.status === 'alarm').length, waterloop: list };
}
