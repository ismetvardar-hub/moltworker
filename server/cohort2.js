/**
 * AŞAMA 1006 — Cohort.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cohort2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'coh_1', name: "Alpha",
      size: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('cohort2', seed);
    return seed;
  }
  return list;
}
export function listCohort2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCohort2(input, actor = 'system') {
  const row = {
    id: `coh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    size: input.size !== undefined ? Number(input.size) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cohort2', row, 300);
  appendAudit({
    actor,
    action: 'cohort2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCohort2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cohort2', list);
  appendAudit({ actor, action: 'cohort2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cohort2Summary() {
  const list = listCohort2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, cohort2: list };
}
