/**
 * AŞAMA 145 — Vergi Paketi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('taxpack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tax_1', period: "2026-Q2",
      amount: "12000", status: 'draft', at: new Date().toISOString() }];
    writeCollection('taxpack', seed);
    return seed;
  }
  return list;
}
export function listTaxpack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTaxpack(input, actor = 'system') {
  const row = {
    id: `tax_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    period: input.period !== undefined ? input.period : "2026-Q2",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 12000,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('taxpack', row, 300);
  appendAudit({ actor, action: 'taxpack.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateTaxpack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('taxpack', list);
  appendAudit({ actor, action: 'taxpack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function taxpackSummary() {
  const list = listTaxpack();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    filed: list.filter((x) => x.status === 'filed').length,
    closed: list.filter((x) => x.status === 'closed').length, taxpack: list };
}
