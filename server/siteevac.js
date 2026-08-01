/**
 * AŞAMA 833 — Site Evac.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('siteevac', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sit_1', site: "Alpha",
      status: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('siteevac', seed);
    return seed;
  }
  return list;
}
export function listSiteevac(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSiteevac(input, actor = 'system') {
  const row = {
    id: `sit_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('siteevac', row, 300);
  appendAudit({
    actor,
    action: 'siteevac.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSiteevac(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('siteevac', list);
  appendAudit({ actor, action: 'siteevac.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function siteevacSummary() {
  const list = listSiteevac();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, siteevac: list };
}
