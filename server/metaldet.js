/**
 * AŞAMA 208 — Metal Dedektör.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('metaldet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mtd_1', point: "Gate-2",
      result: "clear", status: 'clear', at: new Date().toISOString() }];
    writeCollection('metaldet', seed);
    return seed;
  }
  return list;
}
export function listMetaldet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMetaldet(input, actor = 'system') {
  const row = {
    id: `mtd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    point: input.point !== undefined ? input.point : "Gate-2",
    result: input.result !== undefined ? input.result : "clear",
    status: input.status || 'clear',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('metaldet', row, 300);
  appendAudit({ actor, action: 'metaldet.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateMetaldet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('metaldet', list);
  appendAudit({ actor, action: 'metaldet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function metaldetSummary() {
  const list = listMetaldet();
  return { total: list.length, clear: list.filter((x) => x.status === 'clear').length,
    alarm: list.filter((x) => x.status === 'alarm').length,
    bypass: list.filter((x) => x.status === 'bypass').length, metaldet: list };
}
