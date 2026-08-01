/**
 * AŞAMA 140 — Ziyaretçi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('visitors', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vis_1', name: "Misafir",
      host: "Resepsiyon", status: 'checked_in', at: new Date().toISOString() }];
    writeCollection('visitors', seed);
    return seed;
  }
  return list;
}
export function listVisitors(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVisitors(input, actor = 'system') {
  const row = {
    id: `vis_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Misafir",
    host: input.host !== undefined ? input.host : "Resepsiyon",
    status: input.status || 'checked_in',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('visitors', row, 300);
  appendAudit({ actor, action: 'visitors.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateVisitors(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('visitors', list);
  appendAudit({ actor, action: 'visitors.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function visitorsSummary() {
  const list = listVisitors();
  return { total: list.length, checked_in: list.filter((x) => x.status === 'checked_in').length,
    checked_out: list.filter((x) => x.status === 'checked_out').length,
    denied: list.filter((x) => x.status === 'denied').length, visitors: list };
}
