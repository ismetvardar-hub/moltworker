/**
 * AŞAMA 377 — Paket Mix.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('packagemix', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pmx_1', package: "Sunset Duo",
      attach: "18", status: 'active', at: new Date().toISOString() }];
    writeCollection('packagemix', seed);
    return seed;
  }
  return list;
}
export function listPackagemix(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPackagemix(input, actor = 'system') {
  const row = {
    id: `pmx_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    package: input.package !== undefined ? input.package : "Sunset Duo",
    attach: input.attach !== undefined ? Number(input.attach) || 0 : 18,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('packagemix', row, 300);
  appendAudit({
    actor,
    action: 'packagemix.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePackagemix(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('packagemix', list);
  appendAudit({ actor, action: 'packagemix.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function packagemixSummary() {
  const list = listPackagemix();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length, packagemix: list };
}
