/**
 * AŞAMA 382 — Pickup Pace.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pickuppace', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pkp_1', date: "2026-08-20",
      pace: "112", status: 'ahead', at: new Date().toISOString() }];
    writeCollection('pickuppace', seed);
    return seed;
  }
  return list;
}
export function listPickuppace(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPickuppace(input, actor = 'system') {
  const row = {
    id: `pkp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    date: input.date !== undefined ? input.date : "2026-08-20",
    pace: input.pace !== undefined ? Number(input.pace) || 0 : 112,
    status: input.status || 'ahead',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pickuppace', row, 300);
  appendAudit({
    actor,
    action: 'pickuppace.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePickuppace(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pickuppace', list);
  appendAudit({ actor, action: 'pickuppace.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pickuppaceSummary() {
  const list = listPickuppace();
  return { total: list.length, ahead: list.filter((x) => x.status === 'ahead').length,
    on_pace: list.filter((x) => x.status === 'on_pace').length,
    behind: list.filter((x) => x.status === 'behind').length, pickuppace: list };
}
