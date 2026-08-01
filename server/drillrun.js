/**
 * AŞAMA 515 — Drill Run.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('drillrun', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'drl_1', drill: "Fire",
      score: "90", status: 'planned', at: new Date().toISOString() }];
    writeCollection('drillrun', seed);
    return seed;
  }
  return list;
}
export function listDrillrun(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDrillrun(input, actor = 'system') {
  const row = {
    id: `drl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    drill: input.drill !== undefined ? input.drill : "Fire",
    score: input.score !== undefined ? Number(input.score) || 0 : 90,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('drillrun', row, 300);
  appendAudit({
    actor,
    action: 'drillrun.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDrillrun(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('drillrun', list);
  appendAudit({ actor, action: 'drillrun.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function drillrunSummary() {
  const list = listDrillrun();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    running: list.filter((x) => x.status === 'running').length,
    scored: list.filter((x) => x.status === 'scored').length, drillrun: list };
}
