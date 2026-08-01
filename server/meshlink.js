/**
 * AŞAMA 332 — Mesh Link.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('meshlink', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'msh_1', link: "A-B",
      rssi: "-62", status: 'up', at: new Date().toISOString() }];
    writeCollection('meshlink', seed);
    return seed;
  }
  return list;
}
export function listMeshlink(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMeshlink(input, actor = 'system') {
  const row = {
    id: `msh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    link: input.link !== undefined ? input.link : "A-B",
    rssi: input.rssi !== undefined ? Number(input.rssi) || 0 : -62,
    status: input.status || 'up',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('meshlink', row, 300);
  appendAudit({
    actor,
    action: 'meshlink.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMeshlink(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('meshlink', list);
  appendAudit({ actor, action: 'meshlink.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function meshlinkSummary() {
  const list = listMeshlink();
  return { total: list.length, up: list.filter((x) => x.status === 'up').length,
    flap: list.filter((x) => x.status === 'flap').length,
    down: list.filter((x) => x.status === 'down').length, meshlink: list };
}
