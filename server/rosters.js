/**
 * AŞAMA 136 — Haftalık Roster.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('rosters', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rst_1', employee: "Ayşe",
      shift: "Sabah", status: 'draft', at: new Date().toISOString() }];
    writeCollection('rosters', seed);
    return seed;
  }
  return list;
}
export function listRosters(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRosters(input, actor = 'system') {
  const row = {
    id: `rst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ayşe",
    shift: input.shift !== undefined ? input.shift : "Sabah",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rosters', row, 300);
  appendAudit({ actor, action: 'rosters.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateRosters(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rosters', list);
  appendAudit({ actor, action: 'rosters.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rostersSummary() {
  const list = listRosters();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    locked: list.filter((x) => x.status === 'locked').length, rosters: list };
}
