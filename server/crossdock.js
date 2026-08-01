/**
 * AŞAMA 725 — Cross Dock.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('crossdock', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cro_1', from: "Alpha",
      to: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('crossdock', seed);
    return seed;
  }
  return list;
}
export function listCrossdock(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCrossdock(input, actor = 'system') {
  const row = {
    id: `cro_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "Alpha",
    to: input.to !== undefined ? input.to : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('crossdock', row, 300);
  appendAudit({
    actor,
    action: 'crossdock.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCrossdock(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('crossdock', list);
  appendAudit({ actor, action: 'crossdock.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function crossdockSummary() {
  const list = listCrossdock();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, crossdock: list };
}
