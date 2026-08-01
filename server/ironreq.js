/**
 * AŞAMA 235 — Ütü Talebi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ironreq', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'irn_1', room: "407",
      item: "Ütü", status: 'queued', at: new Date().toISOString() }];
    writeCollection('ironreq', seed);
    return seed;
  }
  return list;
}
export function listIronreq(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIronreq(input, actor = 'system') {
  const row = {
    id: `irn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "407",
    item: input.item !== undefined ? input.item : "Ütü",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ironreq', row, 300);
  appendAudit({ actor, action: 'ironreq.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateIronreq(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ironreq', list);
  appendAudit({ actor, action: 'ironreq.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ironreqSummary() {
  const list = listIronreq();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    picked: list.filter((x) => x.status === 'picked').length, ironreq: list };
}
