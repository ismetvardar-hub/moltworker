/**
 * AŞAMA 1193 — Site Evac.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('siteevac3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sit_1', site: "Alpha",
      status: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('siteevac3', seed);
    return seed;
  }
  return list;
}
export function listSiteevac3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSiteevac3(input, actor = 'system') {
  const row = {
    id: `sit_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('siteevac3', row, 300);
  appendAudit({
    actor,
    action: 'siteevac3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSiteevac3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('siteevac3', list);
  appendAudit({ actor, action: 'siteevac3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function siteevac3Summary() {
  const list = listSiteevac3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, siteevac3: list };
}
