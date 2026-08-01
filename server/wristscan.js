/**
 * AŞAMA 205 — Bileklik Scan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wristscan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wrs_1', code: "W-100",
      gate: "Beach", status: 'ok', at: new Date().toISOString() }];
    writeCollection('wristscan', seed);
    return seed;
  }
  return list;
}
export function listWristscan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWristscan(input, actor = 'system') {
  const row = {
    id: `wrs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "W-100",
    gate: input.gate !== undefined ? input.gate : "Beach",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wristscan', row, 300);
  appendAudit({ actor, action: 'wristscan.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateWristscan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wristscan', list);
  appendAudit({ actor, action: 'wristscan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wristscanSummary() {
  const list = listWristscan();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    deny: list.filter((x) => x.status === 'deny').length,
    dup: list.filter((x) => x.status === 'dup').length, wristscan: list };
}
