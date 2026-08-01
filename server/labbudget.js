/**
 * AŞAMA 809 — Lab Budget.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('labbudget', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lab_1', project: "Alpha",
      amount: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('labbudget', seed);
    return seed;
  }
  return list;
}
export function listLabbudget(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLabbudget(input, actor = 'system') {
  const row = {
    id: `lab_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    project: input.project !== undefined ? input.project : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('labbudget', row, 300);
  appendAudit({
    actor,
    action: 'labbudget.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLabbudget(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('labbudget', list);
  appendAudit({ actor, action: 'labbudget.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function labbudgetSummary() {
  const list = listLabbudget();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, labbudget: list };
}
