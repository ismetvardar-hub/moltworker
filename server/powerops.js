/**
 * AŞAMA 170 — Güç Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('powerops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pwr_1', unit: "UPS-1",
      load: "42", status: 'ok', at: new Date().toISOString() }];
    writeCollection('powerops', seed);
    return seed;
  }
  return list;
}
export function listPowerops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPowerops(input, actor = 'system') {
  const row = {
    id: `pwr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "UPS-1",
    load: input.load !== undefined ? Number(input.load) || 0 : 42,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('powerops', row, 300);
  appendAudit({ actor, action: 'powerops.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updatePowerops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('powerops', list);
  appendAudit({ actor, action: 'powerops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function poweropsSummary() {
  const list = listPowerops();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    alert: list.filter((x) => x.status === 'alert').length,
    maintenance: list.filter((x) => x.status === 'maintenance').length, powerops: list };
}
