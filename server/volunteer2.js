/**
 * AŞAMA 999 — Volunteer.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('volunteer2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vol_1', person: "Alpha",
      role: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('volunteer2', seed);
    return seed;
  }
  return list;
}
export function listVolunteer2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVolunteer2(input, actor = 'system') {
  const row = {
    id: `vol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Alpha",
    role: input.role !== undefined ? input.role : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('volunteer2', row, 300);
  appendAudit({
    actor,
    action: 'volunteer2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVolunteer2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('volunteer2', list);
  appendAudit({ actor, action: 'volunteer2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function volunteer2Summary() {
  const list = listVolunteer2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, volunteer2: list };
}
