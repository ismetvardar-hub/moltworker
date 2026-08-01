/**
 * AŞAMA 196 — Yoğunluk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('crowddens', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cwd_1', zone: "Beach",
      dens: "62", status: 'low', at: new Date().toISOString() }];
    writeCollection('crowddens', seed);
    return seed;
  }
  return list;
}
export function listCrowddens(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCrowddens(input, actor = 'system') {
  const row = {
    id: `cwd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Beach",
    dens: input.dens !== undefined ? Number(input.dens) || 0 : 62,
    status: input.status || 'low',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('crowddens', row, 300);
  appendAudit({ actor, action: 'crowddens.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateCrowddens(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('crowddens', list);
  appendAudit({ actor, action: 'crowddens.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function crowddensSummary() {
  const list = listCrowddens();
  return { total: list.length, low: list.filter((x) => x.status === 'low').length,
    normal: list.filter((x) => x.status === 'normal').length,
    high: list.filter((x) => x.status === 'high').length, crowddens: list };
}
