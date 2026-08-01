/**
 * AŞAMA 881 — Alumni.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('alumni', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'alu_1', person: "Alpha",
      cohort: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('alumni', seed);
    return seed;
  }
  return list;
}
export function listAlumni(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAlumni(input, actor = 'system') {
  const row = {
    id: `alu_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Alpha",
    cohort: input.cohort !== undefined ? input.cohort : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('alumni', row, 300);
  appendAudit({
    actor,
    action: 'alumni.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAlumni(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('alumni', list);
  appendAudit({ actor, action: 'alumni.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function alumniSummary() {
  const list = listAlumni();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, alumni: list };
}
