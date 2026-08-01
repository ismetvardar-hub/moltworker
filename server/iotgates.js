/**
 * AŞAMA 169 — IoT Kapı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('iotgates', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'iot_1', gate: "VIP",
      event: "open", status: 'ok', at: new Date().toISOString() }];
    writeCollection('iotgates', seed);
    return seed;
  }
  return list;
}
export function listIotgates(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIotgates(input, actor = 'system') {
  const row = {
    id: `iot_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "VIP",
    event: input.event !== undefined ? input.event : "open",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('iotgates', row, 300);
  appendAudit({ actor, action: 'iotgates.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateIotgates(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('iotgates', list);
  appendAudit({ actor, action: 'iotgates.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function iotgatesSummary() {
  const list = listIotgates();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    jam: list.filter((x) => x.status === 'jam').length,
    offline: list.filter((x) => x.status === 'offline').length, iotgates: list };
}
