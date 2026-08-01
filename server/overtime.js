/**
 * AŞAMA 137 — Mesai.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('overtime', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'otm_1', employee: "Ali",
      hours: "2", status: 'requested', at: new Date().toISOString() }];
    writeCollection('overtime', seed);
    return seed;
  }
  return list;
}
export function listOvertime(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOvertime(input, actor = 'system') {
  const row = {
    id: `otm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ali",
    hours: input.hours !== undefined ? Number(input.hours) || 0 : 2,
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('overtime', row, 300);
  appendAudit({ actor, action: 'overtime.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateOvertime(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('overtime', list);
  appendAudit({ actor, action: 'overtime.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function overtimeSummary() {
  const list = listOvertime();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    paid: list.filter((x) => x.status === 'paid').length, overtime: list };
}
