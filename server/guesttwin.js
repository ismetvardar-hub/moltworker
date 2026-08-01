/**
 * AŞAMA 346 — Guest Twin.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guesttwin', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gtw_1', guestName: "Misafir",
      persona: "Beach", status: 'active', at: new Date().toISOString() }];
    writeCollection('guesttwin', seed);
    return seed;
  }
  return list;
}
export function listGuesttwin(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuesttwin(input, actor = 'system') {
  const row = {
    id: `gtw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    persona: input.persona !== undefined ? input.persona : "Beach",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guesttwin', row, 300);
  appendAudit({
    actor,
    action: 'guesttwin.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuesttwin(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guesttwin', list);
  appendAudit({ actor, action: 'guesttwin.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guesttwinSummary() {
  const list = listGuesttwin();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    stale: list.filter((x) => x.status === 'stale').length,
    archived: list.filter((x) => x.status === 'archived').length, guesttwin: list };
}
