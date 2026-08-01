/**
 * AŞAMA 503 — Payroll Run.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('payrollrun', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pyr_1', period: "2026-07",
      headcount: "86", status: 'draft', at: new Date().toISOString() }];
    writeCollection('payrollrun', seed);
    return seed;
  }
  return list;
}
export function listPayrollrun(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPayrollrun(input, actor = 'system') {
  const row = {
    id: `pyr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    period: input.period !== undefined ? input.period : "2026-07",
    headcount: input.headcount !== undefined ? Number(input.headcount) || 0 : 86,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('payrollrun', row, 300);
  appendAudit({
    actor,
    action: 'payrollrun.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePayrollrun(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('payrollrun', list);
  appendAudit({ actor, action: 'payrollrun.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function payrollrunSummary() {
  const list = listPayrollrun();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    locked: list.filter((x) => x.status === 'locked').length,
    paid: list.filter((x) => x.status === 'paid').length, payrollrun: list };
}
