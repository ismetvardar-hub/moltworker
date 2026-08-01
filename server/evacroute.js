/**
 * AŞAMA 514 — Evac Route.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('evacroute', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'evr_1', route: "East stair",
      clear: "yes", status: 'clear', at: new Date().toISOString() }];
    writeCollection('evacroute', seed);
    return seed;
  }
  return list;
}
export function listEvacroute(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEvacroute(input, actor = 'system') {
  const row = {
    id: `evr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "East stair",
    clear: input.clear !== undefined ? input.clear : "yes",
    status: input.status || 'clear',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('evacroute', row, 300);
  appendAudit({
    actor,
    action: 'evacroute.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEvacroute(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('evacroute', list);
  appendAudit({ actor, action: 'evacroute.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function evacrouteSummary() {
  const list = listEvacroute();
  return { total: list.length, clear: list.filter((x) => x.status === 'clear').length,
    blocked: list.filter((x) => x.status === 'blocked').length,
    repair: list.filter((x) => x.status === 'repair').length, evacroute: list };
}
