/**
 * AŞAMA 520 — Permit Work.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('permitwork', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ptw_1', permit: "Hot work",
      zone: "Roof", status: 'requested', at: new Date().toISOString() }];
    writeCollection('permitwork', seed);
    return seed;
  }
  return list;
}
export function listPermitwork(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPermitwork(input, actor = 'system') {
  const row = {
    id: `ptw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    permit: input.permit !== undefined ? input.permit : "Hot work",
    zone: input.zone !== undefined ? input.zone : "Roof",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('permitwork', row, 300);
  appendAudit({
    actor,
    action: 'permitwork.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePermitwork(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('permitwork', list);
  appendAudit({ actor, action: 'permitwork.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function permitworkSummary() {
  const list = listPermitwork();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, permitwork: list };
}
