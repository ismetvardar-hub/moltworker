/**
 * AŞAMA 685 — Climate Goal.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('climategoal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clg_1', goal: "Net zero 2035",
      progress: "22", status: 'on_track', at: new Date().toISOString() }];
    writeCollection('climategoal', seed);
    return seed;
  }
  return list;
}
export function listClimategoal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClimategoal(input, actor = 'system') {
  const row = {
    id: `clg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    goal: input.goal !== undefined ? input.goal : "Net zero 2035",
    progress: input.progress !== undefined ? Number(input.progress) || 0 : 22,
    status: input.status || 'on_track',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('climategoal', row, 300);
  appendAudit({
    actor,
    action: 'climategoal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateClimategoal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('climategoal', list);
  appendAudit({ actor, action: 'climategoal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function climategoalSummary() {
  const list = listClimategoal();
  return { total: list.length, on_track: list.filter((x) => x.status === 'on_track').length,
    lag: list.filter((x) => x.status === 'lag').length,
    hit: list.filter((x) => x.status === 'hit').length, climategoal: list };
}
