/**
 * AŞAMA 849 — Land Lease.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('landlease', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lan_1', parcel: "Alpha",
      term: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('landlease', seed);
    return seed;
  }
  return list;
}
export function listLandlease(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLandlease(input, actor = 'system') {
  const row = {
    id: `lan_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    parcel: input.parcel !== undefined ? input.parcel : "Alpha",
    term: input.term !== undefined ? input.term : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('landlease', row, 300);
  appendAudit({
    actor,
    action: 'landlease.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLandlease(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('landlease', list);
  appendAudit({ actor, action: 'landlease.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function landleaseSummary() {
  const list = listLandlease();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, landlease: list };
}
