/**
 * AŞAMA 736 — Supplier KPI.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('supplierkpi', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sup_1', vendor: "Alpha",
      score: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('supplierkpi', seed);
    return seed;
  }
  return list;
}
export function listSupplierkpi(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSupplierkpi(input, actor = 'system') {
  const row = {
    id: `sup_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('supplierkpi', row, 300);
  appendAudit({
    actor,
    action: 'supplierkpi.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSupplierkpi(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('supplierkpi', list);
  appendAudit({ actor, action: 'supplierkpi.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function supplierkpiSummary() {
  const list = listSupplierkpi();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, supplierkpi: list };
}
