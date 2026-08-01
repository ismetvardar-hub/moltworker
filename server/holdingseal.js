/**
 * AŞAMA 888 — Holding Seal.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('holdingseal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hol_1', seal: "Alpha",
      version: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('holdingseal', seed);
    return seed;
  }
  return list;
}
export function listHoldingseal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHoldingseal(input, actor = 'system') {
  const row = {
    id: `hol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    seal: input.seal !== undefined ? input.seal : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('holdingseal', row, 300);
  appendAudit({
    actor,
    action: 'holdingseal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHoldingseal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('holdingseal', list);
  appendAudit({ actor, action: 'holdingseal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function holdingsealSummary() {
  const list = listHoldingseal();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, holdingseal: list };
}
