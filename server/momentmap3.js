/**
 * AŞAMA 1126 — Moment Map.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('momentmap3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mom_1', moment: "Alpha",
      zone: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('momentmap3', seed);
    return seed;
  }
  return list;
}
export function listMomentmap3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMomentmap3(input, actor = 'system') {
  const row = {
    id: `mom_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    moment: input.moment !== undefined ? input.moment : "Alpha",
    zone: input.zone !== undefined ? input.zone : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('momentmap3', row, 300);
  appendAudit({
    actor,
    action: 'momentmap3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMomentmap3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('momentmap3', list);
  appendAudit({ actor, action: 'momentmap3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function momentmap3Summary() {
  const list = listMomentmap3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, momentmap3: list };
}
