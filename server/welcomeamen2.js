/**
 * AŞAMA 968 — Welcome Amen.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('welcomeamen2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wel_1', room: "Alpha",
      amenity: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('welcomeamen2', seed);
    return seed;
  }
  return list;
}
export function listWelcomeamen2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWelcomeamen2(input, actor = 'system') {
  const row = {
    id: `wel_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Alpha",
    amenity: input.amenity !== undefined ? input.amenity : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('welcomeamen2', row, 300);
  appendAudit({
    actor,
    action: 'welcomeamen2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWelcomeamen2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('welcomeamen2', list);
  appendAudit({ actor, action: 'welcomeamen2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function welcomeamen2Summary() {
  const list = listWelcomeamen2();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, welcomeamen2: list };
}
