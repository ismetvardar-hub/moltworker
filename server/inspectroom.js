/**
 * AŞAMA 609 — Inspect Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('inspectroom', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'insr_1', room: "412",
      score: "95", status: 'pass', at: new Date().toISOString() }];
    writeCollection('inspectroom', seed);
    return seed;
  }
  return list;
}
export function listInspectroom(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInspectroom(input, actor = 'system') {
  const row = {
    id: `insr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    score: input.score !== undefined ? Number(input.score) || 0 : 95,
    status: input.status || 'pass',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('inspectroom', row, 300);
  appendAudit({
    actor,
    action: 'inspectroom.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInspectroom(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('inspectroom', list);
  appendAudit({ actor, action: 'inspectroom.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function inspectroomSummary() {
  const list = listInspectroom();
  return { total: list.length, pass: list.filter((x) => x.status === 'pass').length,
    fail: list.filter((x) => x.status === 'fail').length,
    rework: list.filter((x) => x.status === 'rework').length, inspectroom: list };
}
