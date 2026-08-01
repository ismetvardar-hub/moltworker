/**
 * AŞAMA 184 — Surf School.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('surfschool', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'srf_1', skill: "Beginner",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('surfschool', seed);
    return seed;
  }
  return list;
}
export function listSurfschool(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSurfschool(input, actor = 'system') {
  const row = {
    id: `srf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    skill: input.skill !== undefined ? input.skill : "Beginner",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('surfschool', row, 300);
  appendAudit({ actor, action: 'surfschool.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateSurfschool(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('surfschool', list);
  appendAudit({ actor, action: 'surfschool.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function surfschoolSummary() {
  const list = listSurfschool();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, surfschool: list };
}
