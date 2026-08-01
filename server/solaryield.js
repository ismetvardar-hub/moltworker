/**
 * AŞAMA 680 — Solar Yield.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('solaryield', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sol_1', array: "Roof-A",
      kwh: "420", status: 'producing', at: new Date().toISOString() }];
    writeCollection('solaryield', seed);
    return seed;
  }
  return list;
}
export function listSolaryield(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSolaryield(input, actor = 'system') {
  const row = {
    id: `sol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    array: input.array !== undefined ? input.array : "Roof-A",
    kwh: input.kwh !== undefined ? Number(input.kwh) || 0 : 420,
    status: input.status || 'producing',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('solaryield', row, 300);
  appendAudit({
    actor,
    action: 'solaryield.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSolaryield(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('solaryield', list);
  appendAudit({ actor, action: 'solaryield.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function solaryieldSummary() {
  const list = listSolaryield();
  return { total: list.length, producing: list.filter((x) => x.status === 'producing').length,
    curtailed: list.filter((x) => x.status === 'curtailed').length,
    fault: list.filter((x) => x.status === 'fault').length, solaryield: list };
}
