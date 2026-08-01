/**
 * AŞAMA 789 — Volunteer.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('volunteer', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vol_1', person: "Alpha",
      role: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('volunteer', seed);
    return seed;
  }
  return list;
}
export function listVolunteer(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVolunteer(input, actor = 'system') {
  const row = {
    id: `vol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Alpha",
    role: input.role !== undefined ? input.role : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('volunteer', row, 300);
  appendAudit({
    actor,
    action: 'volunteer.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVolunteer(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('volunteer', list);
  appendAudit({ actor, action: 'volunteer.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function volunteerSummary() {
  const list = listVolunteer();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, volunteer: list };
}
