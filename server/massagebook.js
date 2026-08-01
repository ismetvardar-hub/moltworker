/**
 * AŞAMA 471 — Massage Book.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('massagebook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'msg_1', therapy: "Deep tissue",
      therapist: "Ela", status: 'booked', at: new Date().toISOString() }];
    writeCollection('massagebook', seed);
    return seed;
  }
  return list;
}
export function listMassagebook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMassagebook(input, actor = 'system') {
  const row = {
    id: `msg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    therapy: input.therapy !== undefined ? input.therapy : "Deep tissue",
    therapist: input.therapist !== undefined ? input.therapist : "Ela",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('massagebook', row, 300);
  appendAudit({
    actor,
    action: 'massagebook.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMassagebook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('massagebook', list);
  appendAudit({ actor, action: 'massagebook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function massagebookSummary() {
  const list = listMassagebook();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    in_session: list.filter((x) => x.status === 'in_session').length,
    done: list.filter((x) => x.status === 'done').length, massagebook: list };
}
