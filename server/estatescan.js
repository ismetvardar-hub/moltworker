/**
 * AŞAMA 494 — Estate Scan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('estatescan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'esc_1', zone: "Plant",
      score: "88", status: 'green', at: new Date().toISOString() }];
    writeCollection('estatescan', seed);
    return seed;
  }
  return list;
}
export function listEstatescan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEstatescan(input, actor = 'system') {
  const row = {
    id: `esc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Plant",
    score: input.score !== undefined ? Number(input.score) || 0 : 88,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('estatescan', row, 300);
  appendAudit({
    actor,
    action: 'estatescan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEstatescan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('estatescan', list);
  appendAudit({ actor, action: 'estatescan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function estatescanSummary() {
  const list = listEstatescan();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, estatescan: list };
}
