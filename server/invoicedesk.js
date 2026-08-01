/**
 * AŞAMA 575 — Invoice Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('invoicedesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inv_1', number: "LYK-2401",
      amount: "12500", status: 'draft', at: new Date().toISOString() }];
    writeCollection('invoicedesk', seed);
    return seed;
  }
  return list;
}
export function listInvoicedesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInvoicedesk(input, actor = 'system') {
  const row = {
    id: `inv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    number: input.number !== undefined ? input.number : "LYK-2401",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 12500,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('invoicedesk', row, 300);
  appendAudit({
    actor,
    action: 'invoicedesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInvoicedesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('invoicedesk', list);
  appendAudit({ actor, action: 'invoicedesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function invoicedeskSummary() {
  const list = listInvoicedesk();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    sent: list.filter((x) => x.status === 'sent').length,
    paid: list.filter((x) => x.status === 'paid').length, invoicedesk: list };
}
