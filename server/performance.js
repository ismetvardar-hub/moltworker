/**
 * AŞAMA 264 — Performans.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('performance', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prf_1', employee: "Ayşe",
      score: "4", status: 'draft', at: new Date().toISOString() }];
    writeCollection('performance', seed);
    return seed;
  }
  return list;
}
export function listPerformance(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPerformance(input, actor = 'system') {
  const row = {
    id: `prf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ayşe",
    score: input.score !== undefined ? Number(input.score) || 0 : 4,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('performance', row, 300);
  appendAudit({ actor, action: 'performance.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updatePerformance(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('performance', list);
  appendAudit({ actor, action: 'performance.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function performanceSummary() {
  const list = listPerformance();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    final: list.filter((x) => x.status === 'final').length, performance: list };
}
