/**
 * AŞAMA 1016 — Incubate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('incubate2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inc_1', project: "Alpha",
      stage: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('incubate2', seed);
    return seed;
  }
  return list;
}
export function listIncubate2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIncubate2(input, actor = 'system') {
  const row = {
    id: `inc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    project: input.project !== undefined ? input.project : "Alpha",
    stage: input.stage !== undefined ? input.stage : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('incubate2', row, 300);
  appendAudit({
    actor,
    action: 'incubate2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIncubate2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('incubate2', list);
  appendAudit({ actor, action: 'incubate2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function incubate2Summary() {
  const list = listIncubate2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, incubate2: list };
}
