/**
 * AŞAMA 172 — Yeşil Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('greenops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'grn_1', area: "Sahil bahçe",
      task: "Sulama", status: 'planned', at: new Date().toISOString() }];
    writeCollection('greenops', seed);
    return seed;
  }
  return list;
}
export function listGreenops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGreenops(input, actor = 'system') {
  const row = {
    id: `grn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    area: input.area !== undefined ? input.area : "Sahil bahçe",
    task: input.task !== undefined ? input.task : "Sulama",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('greenops', row, 300);
  appendAudit({ actor, action: 'greenops.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateGreenops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('greenops', list);
  appendAudit({ actor, action: 'greenops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function greenopsSummary() {
  const list = listGreenops();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    done: list.filter((x) => x.status === 'done').length,
    skipped: list.filter((x) => x.status === 'skipped').length, greenops: list };
}
