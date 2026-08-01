/**
 * AŞAMA 845 — Soft Open.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('softopen', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sof_1', site: "Alpha",
      date: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('softopen', seed);
    return seed;
  }
  return list;
}
export function listSoftopen(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSoftopen(input, actor = 'system') {
  const row = {
    id: `sof_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    date: input.date !== undefined ? input.date : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('softopen', row, 300);
  appendAudit({
    actor,
    action: 'softopen.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSoftopen(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('softopen', list);
  appendAudit({ actor, action: 'softopen.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function softopenSummary() {
  const list = listSoftopen();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, softopen: list };
}
