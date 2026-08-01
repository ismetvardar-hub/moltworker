/**
 * AŞAMA 267 — İSG Brifi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('safetybrief', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sfb_1', topic: "Yangın",
      attendees: "12", status: 'planned', at: new Date().toISOString() }];
    writeCollection('safetybrief', seed);
    return seed;
  }
  return list;
}
export function listSafetybrief(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSafetybrief(input, actor = 'system') {
  const row = {
    id: `sfb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Yangın",
    attendees: input.attendees !== undefined ? Number(input.attendees) || 0 : 12,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('safetybrief', row, 300);
  appendAudit({ actor, action: 'safetybrief.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateSafetybrief(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('safetybrief', list);
  appendAudit({ actor, action: 'safetybrief.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function safetybriefSummary() {
  const list = listSafetybrief();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    done: list.filter((x) => x.status === 'done').length, safetybrief: list };
}
