/**
 * AŞAMA 618 — Desk Queue.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('deskqueue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dqe_1', guestName: "Misafir",
      reason: "Check-in", status: 'waiting', at: new Date().toISOString() }];
    writeCollection('deskqueue', seed);
    return seed;
  }
  return list;
}
export function listDeskqueue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDeskqueue(input, actor = 'system') {
  const row = {
    id: `dqe_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    reason: input.reason !== undefined ? input.reason : "Check-in",
    status: input.status || 'waiting',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('deskqueue', row, 300);
  appendAudit({
    actor,
    action: 'deskqueue.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDeskqueue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('deskqueue', list);
  appendAudit({ actor, action: 'deskqueue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function deskqueueSummary() {
  const list = listDeskqueue();
  return { total: list.length, waiting: list.filter((x) => x.status === 'waiting').length,
    serving: list.filter((x) => x.status === 'serving').length,
    done: list.filter((x) => x.status === 'done').length, deskqueue: list };
}
