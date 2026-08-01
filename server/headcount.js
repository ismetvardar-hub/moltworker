/**
 * AŞAMA 506 — Headcount.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('headcount', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hdc_1', dept: "F&B",
      plan: "42", status: 'planned', at: new Date().toISOString() }];
    writeCollection('headcount', seed);
    return seed;
  }
  return list;
}
export function listHeadcount(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHeadcount(input, actor = 'system') {
  const row = {
    id: `hdc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dept: input.dept !== undefined ? input.dept : "F&B",
    plan: input.plan !== undefined ? Number(input.plan) || 0 : 42,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('headcount', row, 300);
  appendAudit({
    actor,
    action: 'headcount.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHeadcount(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('headcount', list);
  appendAudit({ actor, action: 'headcount.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function headcountSummary() {
  const list = listHeadcount();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    filled: list.filter((x) => x.status === 'filled').length,
    frozen: list.filter((x) => x.status === 'frozen').length, headcount: list };
}
