/**
 * AŞAMA 758 — Welcome Amen.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('welcomeamen', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wel_1', room: "Alpha",
      amenity: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('welcomeamen', seed);
    return seed;
  }
  return list;
}
export function listWelcomeamen(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWelcomeamen(input, actor = 'system') {
  const row = {
    id: `wel_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Alpha",
    amenity: input.amenity !== undefined ? input.amenity : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('welcomeamen', row, 300);
  appendAudit({
    actor,
    action: 'welcomeamen.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWelcomeamen(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('welcomeamen', list);
  appendAudit({ actor, action: 'welcomeamen.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function welcomeamenSummary() {
  const list = listWelcomeamen();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, welcomeamen: list };
}
