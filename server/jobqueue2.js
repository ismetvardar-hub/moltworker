/**
 * AŞAMA 772 — Job Queue+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('jobqueue2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'job_1', queue: "10",
      depth: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('jobqueue2', seed);
    return seed;
  }
  return list;
}
export function listJobqueue2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createJobqueue2(input, actor = 'system') {
  const row = {
    id: `job_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    queue: input.queue !== undefined ? Number(input.queue) || 0 : 10,
    depth: input.depth !== undefined ? Number(input.depth) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('jobqueue2', row, 300);
  appendAudit({
    actor,
    action: 'jobqueue2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateJobqueue2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('jobqueue2', list);
  appendAudit({ actor, action: 'jobqueue2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function jobqueue2Summary() {
  const list = listJobqueue2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, jobqueue2: list };
}
