/**
 * AŞAMA 551 — Guestcase.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guestcase', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cmp2_1', guestName: "Misafir",
      topic: "Noise", status: 'open', at: new Date().toISOString() }];
    writeCollection('guestcase', seed);
    return seed;
  }
  return list;
}
export function listGuestcase(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuestcase(input, actor = 'system') {
  const row = {
    id: `cmp2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    topic: input.topic !== undefined ? input.topic : "Noise",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestcase', row, 300);
  appendAudit({
    actor,
    action: 'guestcase.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuestcase(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestcase', list);
  appendAudit({ actor, action: 'guestcase.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guestcaseSummary() {
  const list = listGuestcase();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    working: list.filter((x) => x.status === 'working').length,
    closed: list.filter((x) => x.status === 'closed').length, guestcase: list };
}
