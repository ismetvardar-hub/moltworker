/**
 * AŞAMA 413 — İskele Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pierops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pir_1', pier: "Main",
      traffic: "Medium", status: 'open', at: new Date().toISOString() }];
    writeCollection('pierops', seed);
    return seed;
  }
  return list;
}
export function listPierops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPierops(input, actor = 'system') {
  const row = {
    id: `pir_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pier: input.pier !== undefined ? input.pier : "Main",
    traffic: input.traffic !== undefined ? input.traffic : "Medium",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pierops', row, 300);
  appendAudit({
    actor,
    action: 'pierops.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePierops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pierops', list);
  appendAudit({ actor, action: 'pierops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pieropsSummary() {
  const list = listPierops();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    busy: list.filter((x) => x.status === 'busy').length,
    closed: list.filter((x) => x.status === 'closed').length, pierops: list };
}
