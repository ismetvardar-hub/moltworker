/**
 * AŞAMA 171 — Su Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('waterops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wtr_1', tank: "Ana",
      level: "78", status: 'ok', at: new Date().toISOString() }];
    writeCollection('waterops', seed);
    return seed;
  }
  return list;
}
export function listWaterops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWaterops(input, actor = 'system') {
  const row = {
    id: `wtr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tank: input.tank !== undefined ? input.tank : "Ana",
    level: input.level !== undefined ? Number(input.level) || 0 : 78,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('waterops', row, 300);
  appendAudit({ actor, action: 'waterops.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateWaterops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('waterops', list);
  appendAudit({ actor, action: 'waterops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wateropsSummary() {
  const list = listWaterops();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    critical: list.filter((x) => x.status === 'critical').length, waterops: list };
}
