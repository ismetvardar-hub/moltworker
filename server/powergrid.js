/**
 * AŞAMA 485 — Power Grid.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('powergrid', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pwr_1', feeder: "Main",
      kw: "420", status: 'grid', at: new Date().toISOString() }];
    writeCollection('powergrid', seed);
    return seed;
  }
  return list;
}
export function listPowergrid(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPowergrid(input, actor = 'system') {
  const row = {
    id: `pwr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    feeder: input.feeder !== undefined ? input.feeder : "Main",
    kw: input.kw !== undefined ? Number(input.kw) || 0 : 420,
    status: input.status || 'grid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('powergrid', row, 300);
  appendAudit({
    actor,
    action: 'powergrid.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePowergrid(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('powergrid', list);
  appendAudit({ actor, action: 'powergrid.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function powergridSummary() {
  const list = listPowergrid();
  return { total: list.length, grid: list.filter((x) => x.status === 'grid').length,
    genset: list.filter((x) => x.status === 'genset').length,
    outage: list.filter((x) => x.status === 'outage').length, powergrid: list };
}
