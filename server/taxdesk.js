/**
 * AŞAMA 576 — Tax Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('taxdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tax_1', period: "2026-07",
      amount: "88000", status: 'accrued', at: new Date().toISOString() }];
    writeCollection('taxdesk', seed);
    return seed;
  }
  return list;
}
export function listTaxdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTaxdesk(input, actor = 'system') {
  const row = {
    id: `tax_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    period: input.period !== undefined ? input.period : "2026-07",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 88000,
    status: input.status || 'accrued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('taxdesk', row, 300);
  appendAudit({
    actor,
    action: 'taxdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTaxdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('taxdesk', list);
  appendAudit({ actor, action: 'taxdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function taxdeskSummary() {
  const list = listTaxdesk();
  return { total: list.length, accrued: list.filter((x) => x.status === 'accrued').length,
    filed: list.filter((x) => x.status === 'filed').length,
    paid: list.filter((x) => x.status === 'paid').length, taxdesk: list };
}
