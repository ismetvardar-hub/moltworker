/**
 * AŞAMA 607 — Turndown.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('turnup', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trn_1', room: "412",
      note: "Extra pillows", status: 'queued', at: new Date().toISOString() }];
    writeCollection('turnup', seed);
    return seed;
  }
  return list;
}
export function listTurnup(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTurnup(input, actor = 'system') {
  const row = {
    id: `trn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    note: input.note !== undefined ? input.note : "Extra pillows",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('turnup', row, 300);
  appendAudit({
    actor,
    action: 'turnup.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTurnup(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('turnup', list);
  appendAudit({ actor, action: 'turnup.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function turnupSummary() {
  const list = listTurnup();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    done: list.filter((x) => x.status === 'done').length,
    skipped: list.filter((x) => x.status === 'skipped').length, turnup: list };
}
