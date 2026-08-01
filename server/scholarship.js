/**
 * AŞAMA 882 — Scholarship.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('scholarship', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sch_1', name: "Alpha",
      amount: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('scholarship', seed);
    return seed;
  }
  return list;
}
export function listScholarship(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createScholarship(input, actor = 'system') {
  const row = {
    id: `sch_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('scholarship', row, 300);
  appendAudit({
    actor,
    action: 'scholarship.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateScholarship(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('scholarship', list);
  appendAudit({ actor, action: 'scholarship.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function scholarshipSummary() {
  const list = listScholarship();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, scholarship: list };
}
