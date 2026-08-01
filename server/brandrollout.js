/**
 * AŞAMA 852 — Brand Rollout.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('brandrollout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bra_1', site: "Alpha",
      wave: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('brandrollout', seed);
    return seed;
  }
  return list;
}
export function listBrandrollout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBrandrollout(input, actor = 'system') {
  const row = {
    id: `bra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    wave: input.wave !== undefined ? input.wave : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('brandrollout', row, 300);
  appendAudit({
    actor,
    action: 'brandrollout.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBrandrollout(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('brandrollout', list);
  appendAudit({ actor, action: 'brandrollout.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function brandrolloutSummary() {
  const list = listBrandrollout();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, brandrollout: list };
}
