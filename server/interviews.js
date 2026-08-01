/**
 * AŞAMA 258 — Mülakat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('interviews', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'intv_1', candidate: "Aday",
      role: "Barista", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('interviews', seed);
    return seed;
  }
  return list;
}
export function listInterviews(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInterviews(input, actor = 'system') {
  const row = {
    id: `intv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    candidate: input.candidate !== undefined ? input.candidate : "Aday",
    role: input.role !== undefined ? input.role : "Barista",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('interviews', row, 300);
  appendAudit({ actor, action: 'interviews.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateInterviews(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('interviews', list);
  appendAudit({ actor, action: 'interviews.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function interviewsSummary() {
  const list = listInterviews();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    done: list.filter((x) => x.status === 'done').length,
    hired: list.filter((x) => x.status === 'hired').length,
    rejected: list.filter((x) => x.status === 'rejected').length, interviews: list };
}
