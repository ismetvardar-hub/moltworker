/**
 * AŞAMA 1096 — Supplier KPI.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('supplierkpi3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sup_1', vendor: "Alpha",
      score: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('supplierkpi3', seed);
    return seed;
  }
  return list;
}
export function listSupplierkpi3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSupplierkpi3(input, actor = 'system') {
  const row = {
    id: `sup_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('supplierkpi3', row, 300);
  appendAudit({
    actor,
    action: 'supplierkpi3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSupplierkpi3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('supplierkpi3', list);
  appendAudit({ actor, action: 'supplierkpi3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function supplierkpi3Summary() {
  const list = listSupplierkpi3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, supplierkpi3: list };
}
