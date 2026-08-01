/**
 * AŞAMA 393 — Roadmap.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('roadmap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rdm_1', epic: "Vanguard POS",
      quarter: "Q3", status: 'backlog', at: new Date().toISOString() }];
    writeCollection('roadmap', seed);
    return seed;
  }
  return list;
}
export function listRoadmap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRoadmap(input, actor = 'system') {
  const row = {
    id: `rdm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    epic: input.epic !== undefined ? input.epic : "Vanguard POS",
    quarter: input.quarter !== undefined ? input.quarter : "Q3",
    status: input.status || 'backlog',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('roadmap', row, 300);
  appendAudit({
    actor,
    action: 'roadmap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRoadmap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('roadmap', list);
  appendAudit({ actor, action: 'roadmap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function roadmapSummary() {
  const list = listRoadmap();
  return { total: list.length, backlog: list.filter((x) => x.status === 'backlog').length,
    now: list.filter((x) => x.status === 'now').length,
    shipped: list.filter((x) => x.status === 'shipped').length, roadmap: list };
}
