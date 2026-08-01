/**
 * AŞAMA 677 — Water Use.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wateruse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wtu_1', meter: "Main",
      m3: "180", status: 'ok', at: new Date().toISOString() }];
    writeCollection('wateruse', seed);
    return seed;
  }
  return list;
}
export function listWateruse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWateruse(input, actor = 'system') {
  const row = {
    id: `wtu_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    meter: input.meter !== undefined ? input.meter : "Main",
    m3: input.m3 !== undefined ? Number(input.m3) || 0 : 180,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wateruse', row, 300);
  appendAudit({
    actor,
    action: 'wateruse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWateruse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wateruse', list);
  appendAudit({ actor, action: 'wateruse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wateruseSummary() {
  const list = listWateruse();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    high: list.filter((x) => x.status === 'high').length,
    alarm: list.filter((x) => x.status === 'alarm').length, wateruse: list };
}
