/**
 * AŞAMA 1131 — Event Bus.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('eventbus3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'eve_1', topic: "Alpha",
      lag: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('eventbus3', seed);
    return seed;
  }
  return list;
}
export function listEventbus3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEventbus3(input, actor = 'system') {
  const row = {
    id: `eve_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Alpha",
    lag: input.lag !== undefined ? input.lag : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('eventbus3', row, 300);
  appendAudit({
    actor,
    action: 'eventbus3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEventbus3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('eventbus3', list);
  appendAudit({ actor, action: 'eventbus3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function eventbus3Summary() {
  const list = listEventbus3();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, eventbus3: list };
}
