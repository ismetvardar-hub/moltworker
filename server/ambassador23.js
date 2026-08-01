/**
 * AŞAMA 1152 — Ambassador+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ambassador23', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'amb_1', name: "Alpha",
      region: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('ambassador23', seed);
    return seed;
  }
  return list;
}
export function listAmbassador23(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAmbassador23(input, actor = 'system') {
  const row = {
    id: `amb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    region: input.region !== undefined ? input.region : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ambassador23', row, 300);
  appendAudit({
    actor,
    action: 'ambassador23.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAmbassador23(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ambassador23', list);
  appendAudit({ actor, action: 'ambassador23.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ambassador23Summary() {
  const list = listAmbassador23();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, ambassador23: list };
}
