/**
 * AŞAMA 501 — Mentorship.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mentorship', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mtr_1', mentor: "Chef",
      mentee: "Commis", status: 'active', at: new Date().toISOString() }];
    writeCollection('mentorship', seed);
    return seed;
  }
  return list;
}
export function listMentorship(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMentorship(input, actor = 'system') {
  const row = {
    id: `mtr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    mentor: input.mentor !== undefined ? input.mentor : "Chef",
    mentee: input.mentee !== undefined ? input.mentee : "Commis",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mentorship', row, 300);
  appendAudit({
    actor,
    action: 'mentorship.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMentorship(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mentorship', list);
  appendAudit({ actor, action: 'mentorship.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mentorshipSummary() {
  const list = listMentorship();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    complete: list.filter((x) => x.status === 'complete').length, mentorship: list };
}
