/**
 * AŞAMA 866 — ISO Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('isotrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'iso_1', standard: "Alpha",
      status: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('isotrack', seed);
    return seed;
  }
  return list;
}
export function listIsotrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIsotrack(input, actor = 'system') {
  const row = {
    id: `iso_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    standard: input.standard !== undefined ? input.standard : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('isotrack', row, 300);
  appendAudit({
    actor,
    action: 'isotrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIsotrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('isotrack', list);
  appendAudit({ actor, action: 'isotrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function isotrackSummary() {
  const list = listIsotrack();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, isotrack: list };
}
