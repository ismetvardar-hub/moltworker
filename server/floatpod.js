/**
 * AŞAMA 470 — Float Pod.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('floatpod', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'flt_1', pod: "F-1",
      guestName: "Misafir", status: 'ready', at: new Date().toISOString() }];
    writeCollection('floatpod', seed);
    return seed;
  }
  return list;
}
export function listFloatpod(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFloatpod(input, actor = 'system') {
  const row = {
    id: `flt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pod: input.pod !== undefined ? input.pod : "F-1",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('floatpod', row, 300);
  appendAudit({
    actor,
    action: 'floatpod.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFloatpod(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('floatpod', list);
  appendAudit({ actor, action: 'floatpod.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function floatpodSummary() {
  const list = listFloatpod();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    floating: list.filter((x) => x.status === 'floating').length,
    clean: list.filter((x) => x.status === 'clean').length, floatpod: list };
}
