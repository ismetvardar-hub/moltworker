/**
 * AŞAMA 441 — Fog Scene.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('fogscene', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fog_1', scene: "Arrival",
      density: "Low", status: 'ready', at: new Date().toISOString() }];
    writeCollection('fogscene', seed);
    return seed;
  }
  return list;
}
export function listFogscene(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFogscene(input, actor = 'system') {
  const row = {
    id: `fog_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    scene: input.scene !== undefined ? input.scene : "Arrival",
    density: input.density !== undefined ? input.density : "Low",
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fogscene', row, 300);
  appendAudit({
    actor,
    action: 'fogscene.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFogscene(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fogscene', list);
  appendAudit({ actor, action: 'fogscene.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function fogsceneSummary() {
  const list = listFogscene();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    active: list.filter((x) => x.status === 'active').length,
    clear: list.filter((x) => x.status === 'clear').length, fogscene: list };
}
