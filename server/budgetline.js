/**
 * AŞAMA 577 — Budget Line.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('budgetline', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bgl_1', costCenter: "F&B",
      amount: "320000", status: 'planned', at: new Date().toISOString() }];
    writeCollection('budgetline', seed);
    return seed;
  }
  return list;
}
export function listBudgetline(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBudgetline(input, actor = 'system') {
  const row = {
    id: `bgl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    costCenter: input.costCenter !== undefined ? input.costCenter : "F&B",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 320000,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('budgetline', row, 300);
  appendAudit({
    actor,
    action: 'budgetline.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBudgetline(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('budgetline', list);
  appendAudit({ actor, action: 'budgetline.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function budgetlineSummary() {
  const list = listBudgetline();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    committed: list.filter((x) => x.status === 'committed').length,
    spent: list.filter((x) => x.status === 'spent').length, budgetline: list };
}
