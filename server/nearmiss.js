/**
 * AŞAMA 268 — Near Miss.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nearmiss', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nms_1', zone: "Mutfak",
      note: "Islak zemin", status: 'reported', at: new Date().toISOString() }];
    writeCollection('nearmiss', seed);
    return seed;
  }
  return list;
}
export function listNearmiss(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNearmiss(input, actor = 'system') {
  const row = {
    id: `nms_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Mutfak",
    note: input.note !== undefined ? input.note : "Islak zemin",
    status: input.status || 'reported',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nearmiss', row, 300);
  appendAudit({ actor, action: 'nearmiss.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateNearmiss(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nearmiss', list);
  appendAudit({ actor, action: 'nearmiss.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nearmissSummary() {
  const list = listNearmiss();
  return { total: list.length, reported: list.filter((x) => x.status === 'reported').length,
    reviewed: list.filter((x) => x.status === 'reviewed').length,
    closed: list.filter((x) => x.status === 'closed').length, nearmiss: list };
}
