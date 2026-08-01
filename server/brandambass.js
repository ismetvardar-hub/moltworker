/**
 * AŞAMA 665 — Brand Ambass.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('brandambass', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bam_1', name: "Elçi",
      tier: "Gold", status: 'active', at: new Date().toISOString() }];
    writeCollection('brandambass', seed);
    return seed;
  }
  return list;
}
export function listBrandambass(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBrandambass(input, actor = 'system') {
  const row = {
    id: `bam_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Elçi",
    tier: input.tier !== undefined ? input.tier : "Gold",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('brandambass', row, 300);
  appendAudit({
    actor,
    action: 'brandambass.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBrandambass(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('brandambass', list);
  appendAudit({ actor, action: 'brandambass.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function brandambassSummary() {
  const list = listBrandambass();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    ended: list.filter((x) => x.status === 'ended').length, brandambass: list };
}
