/**
 * AŞAMA 446 — Guest Flow.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guestflow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gfl_1', zone: "Deck",
      density: "62", status: 'smooth', at: new Date().toISOString() }];
    writeCollection('guestflow', seed);
    return seed;
  }
  return list;
}
export function listGuestflow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuestflow(input, actor = 'system') {
  const row = {
    id: `gfl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Deck",
    density: input.density !== undefined ? Number(input.density) || 0 : 62,
    status: input.status || 'smooth',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestflow', row, 300);
  appendAudit({
    actor,
    action: 'guestflow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuestflow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestflow', list);
  appendAudit({ actor, action: 'guestflow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guestflowSummary() {
  const list = listGuestflow();
  return { total: list.length, smooth: list.filter((x) => x.status === 'smooth').length,
    dense: list.filter((x) => x.status === 'dense').length,
    jam: list.filter((x) => x.status === 'jam').length, guestflow: list };
}
