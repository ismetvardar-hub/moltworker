/**
 * AŞAMA 641 — Arena Book.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('arenabook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'arb_1', arena: "Padel-A",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('arenabook', seed);
    return seed;
  }
  return list;
}
export function listArenabook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArenabook(input, actor = 'system') {
  const row = {
    id: `arb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    arena: input.arena !== undefined ? input.arena : "Padel-A",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('arenabook', row, 300);
  appendAudit({
    actor,
    action: 'arenabook.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateArenabook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('arenabook', list);
  appendAudit({ actor, action: 'arenabook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function arenabookSummary() {
  const list = listArenabook();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    checked_in: list.filter((x) => x.status === 'checked_in').length,
    done: list.filter((x) => x.status === 'done').length,
    no_show: list.filter((x) => x.status === 'no_show').length, arenabook: list };
}
