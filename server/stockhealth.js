/**
 * AŞAMA 656 — Stock Health.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('stockhealth', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sth2_1', sku: "DAZE-TEE",
      score: "88", status: 'green', at: new Date().toISOString() }];
    writeCollection('stockhealth', seed);
    return seed;
  }
  return list;
}
export function listStockhealth(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStockhealth(input, actor = 'system') {
  const row = {
    id: `sth2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "DAZE-TEE",
    score: input.score !== undefined ? Number(input.score) || 0 : 88,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('stockhealth', row, 300);
  appendAudit({
    actor,
    action: 'stockhealth.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStockhealth(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('stockhealth', list);
  appendAudit({ actor, action: 'stockhealth.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function stockhealthSummary() {
  const list = listStockhealth();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, stockhealth: list };
}
