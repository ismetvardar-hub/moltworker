/**
 * AŞAMA 430 — Demurrage.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('demurrage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dmr_1', unit: "LYKU-100",
      days: "2", status: 'accruing', at: new Date().toISOString() }];
    writeCollection('demurrage', seed);
    return seed;
  }
  return list;
}
export function listDemurrage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDemurrage(input, actor = 'system') {
  const row = {
    id: `dmr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "LYKU-100",
    days: input.days !== undefined ? Number(input.days) || 0 : 2,
    status: input.status || 'accruing',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('demurrage', row, 300);
  appendAudit({
    actor,
    action: 'demurrage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDemurrage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('demurrage', list);
  appendAudit({ actor, action: 'demurrage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function demurrageSummary() {
  const list = listDemurrage();
  return { total: list.length, accruing: list.filter((x) => x.status === 'accruing').length,
    invoiced: list.filter((x) => x.status === 'invoiced').length,
    waived: list.filter((x) => x.status === 'waived').length, demurrage: list };
}
