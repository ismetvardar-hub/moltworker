/**
 * AŞAMA 1046 — Drill Score.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('drillscore2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dri_1', drill: "Alpha",
      score: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('drillscore2', seed);
    return seed;
  }
  return list;
}
export function listDrillscore2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDrillscore2(input, actor = 'system') {
  const row = {
    id: `dri_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    drill: input.drill !== undefined ? input.drill : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('drillscore2', row, 300);
  appendAudit({
    actor,
    action: 'drillscore2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDrillscore2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('drillscore2', list);
  appendAudit({ actor, action: 'drillscore2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function drillscore2Summary() {
  const list = listDrillscore2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, drillscore2: list };
}
