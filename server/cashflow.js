/**
 * AŞAMA 572 — Cash Flow.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cashflow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cfl_1', week: "W32",
      net: "180000", status: 'forecast', at: new Date().toISOString() }];
    writeCollection('cashflow', seed);
    return seed;
  }
  return list;
}
export function listCashflow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCashflow(input, actor = 'system') {
  const row = {
    id: `cfl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    week: input.week !== undefined ? input.week : "W32",
    net: input.net !== undefined ? Number(input.net) || 0 : 180000,
    status: input.status || 'forecast',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cashflow', row, 300);
  appendAudit({
    actor,
    action: 'cashflow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCashflow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cashflow', list);
  appendAudit({ actor, action: 'cashflow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cashflowSummary() {
  const list = listCashflow();
  return { total: list.length, forecast: list.filter((x) => x.status === 'forecast').length,
    actual: list.filter((x) => x.status === 'actual').length,
    variance: list.filter((x) => x.status === 'variance').length, cashflow: list };
}
