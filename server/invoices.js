/**
 * AŞAMA 144 — Fatura.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('invoices', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inv_1', vendor: "Tedarikçi",
      amount: "5000", status: 'open', at: new Date().toISOString() }];
    writeCollection('invoices', seed);
    return seed;
  }
  return list;
}
export function listInvoices(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInvoices(input, actor = 'system') {
  const row = {
    id: `inv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Tedarikçi",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5000,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('invoices', row, 300);
  appendAudit({ actor, action: 'invoices.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateInvoices(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('invoices', list);
  appendAudit({ actor, action: 'invoices.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function invoicesSummary() {
  const list = listInvoices();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    paid: list.filter((x) => x.status === 'paid').length,
    overdue: list.filter((x) => x.status === 'overdue').length, invoices: list };
}
