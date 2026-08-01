/**
 * AŞAMA 338 — Backhaul.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('backhaul', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bkh_1', link: "Fiber-1",
      mbps: "920", status: 'up', at: new Date().toISOString() }];
    writeCollection('backhaul', seed);
    return seed;
  }
  return list;
}
export function listBackhaul(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBackhaul(input, actor = 'system') {
  const row = {
    id: `bkh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    link: input.link !== undefined ? input.link : "Fiber-1",
    mbps: input.mbps !== undefined ? Number(input.mbps) || 0 : 920,
    status: input.status || 'up',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('backhaul', row, 300);
  appendAudit({
    actor,
    action: 'backhaul.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBackhaul(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('backhaul', list);
  appendAudit({ actor, action: 'backhaul.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function backhaulSummary() {
  const list = listBackhaul();
  return { total: list.length, up: list.filter((x) => x.status === 'up').length,
    congested: list.filter((x) => x.status === 'congested').length,
    down: list.filter((x) => x.status === 'down').length, backhaul: list };
}
