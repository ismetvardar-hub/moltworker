/**
 * AŞAMA 453 — Plate Up.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('plateup', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'plt_1', dish: "Catch of day",
      covers: "4", status: 'queued', at: new Date().toISOString() }];
    writeCollection('plateup', seed);
    return seed;
  }
  return list;
}
export function listPlateup(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPlateup(input, actor = 'system') {
  const row = {
    id: `plt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dish: input.dish !== undefined ? input.dish : "Catch of day",
    covers: input.covers !== undefined ? Number(input.covers) || 0 : 4,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('plateup', row, 300);
  appendAudit({
    actor,
    action: 'plateup.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePlateup(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('plateup', list);
  appendAudit({ actor, action: 'plateup.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function plateupSummary() {
  const list = listPlateup();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    plated: list.filter((x) => x.status === 'plated').length,
    sent: list.filter((x) => x.status === 'sent').length, plateup: list };
}
