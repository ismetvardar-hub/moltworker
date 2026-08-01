/**
 * AŞAMA 230 — Turndown.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('turndown', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trn_1', room: "212",
      note: "Çikolata", status: 'queued', at: new Date().toISOString() }];
    writeCollection('turndown', seed);
    return seed;
  }
  return list;
}
export function listTurndown(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTurndown(input, actor = 'system') {
  const row = {
    id: `trn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "212",
    note: input.note !== undefined ? input.note : "Çikolata",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('turndown', row, 300);
  appendAudit({ actor, action: 'turndown.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateTurndown(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('turndown', list);
  appendAudit({ actor, action: 'turndown.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function turndownSummary() {
  const list = listTurndown();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    done: list.filter((x) => x.status === 'done').length,
    skipped: list.filter((x) => x.status === 'skipped').length, turndown: list };
}
