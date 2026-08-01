/**
 * AŞAMA 1166 — Incubate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('incubate3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inc_1', project: "Alpha",
      stage: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('incubate3', seed);
    return seed;
  }
  return list;
}
export function listIncubate3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIncubate3(input, actor = 'system') {
  const row = {
    id: `inc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    project: input.project !== undefined ? input.project : "Alpha",
    stage: input.stage !== undefined ? input.stage : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('incubate3', row, 300);
  appendAudit({
    actor,
    action: 'incubate3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIncubate3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('incubate3', list);
  appendAudit({ actor, action: 'incubate3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function incubate3Summary() {
  const list = listIncubate3();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, incubate3: list };
}
