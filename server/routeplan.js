/**
 * AŞAMA 590 — Route Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('routeplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rtp_1', from: "Resort",
      to: "Antalya", status: 'draft', at: new Date().toISOString() }];
    writeCollection('routeplan', seed);
    return seed;
  }
  return list;
}
export function listRouteplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRouteplan(input, actor = 'system') {
  const row = {
    id: `rtp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "Resort",
    to: input.to !== undefined ? input.to : "Antalya",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('routeplan', row, 300);
  appendAudit({
    actor,
    action: 'routeplan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRouteplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('routeplan', list);
  appendAudit({ actor, action: 'routeplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function routeplanSummary() {
  const list = listRouteplan();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, routeplan: list };
}
