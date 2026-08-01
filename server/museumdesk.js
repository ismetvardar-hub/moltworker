/**
 * AŞAMA 878 — Museum Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('museumdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mus_1', exhibit: "Alpha",
      status: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('museumdesk', seed);
    return seed;
  }
  return list;
}
export function listMuseumdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMuseumdesk(input, actor = 'system') {
  const row = {
    id: `mus_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    exhibit: input.exhibit !== undefined ? input.exhibit : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('museumdesk', row, 300);
  appendAudit({
    actor,
    action: 'museumdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMuseumdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('museumdesk', list);
  appendAudit({ actor, action: 'museumdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function museumdeskSummary() {
  const list = listMuseumdesk();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, museumdesk: list };
}
