/**
 * AŞAMA 185 — Paddle.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('paddle', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pdl_1', board: "SUP-01",
      guestName: "Misafir", status: 'available', at: new Date().toISOString() }];
    writeCollection('paddle', seed);
    return seed;
  }
  return list;
}
export function listPaddle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPaddle(input, actor = 'system') {
  const row = {
    id: `pdl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    board: input.board !== undefined ? input.board : "SUP-01",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'available',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('paddle', row, 300);
  appendAudit({ actor, action: 'paddle.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updatePaddle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('paddle', list);
  appendAudit({ actor, action: 'paddle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function paddleSummary() {
  const list = listPaddle();
  return { total: list.length, available: list.filter((x) => x.status === 'available').length,
    out: list.filter((x) => x.status === 'out').length,
    service: list.filter((x) => x.status === 'service').length, paddle: list };
}
