/**
 * AŞAMA 103 — Bordro Özeti.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('payroll', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'pay_1',
      employee: "Ayşe",
      amount: "18000",
      status: 'draft',
      at: new Date().toISOString(),
    }];
    writeCollection('payroll', seed);
    return seed;
  }
  return list;
}

export function listPayroll(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPayroll(input, actor = 'system') {
  const row = {
    id: `pay_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ayşe",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 18000,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('payroll', row, 300);
  appendAudit({
    actor,
    action: 'payroll.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePayroll(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('payroll', list);
  appendAudit({ actor, action: 'payroll.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function payrollSummary() {
  const list = listPayroll();
  return {
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    approved: list.filter((x) => x.status === 'approved').length,
    paid: list.filter((x) => x.status === 'paid').length,
    payroll: list,
  };
}
