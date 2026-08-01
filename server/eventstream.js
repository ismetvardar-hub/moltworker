/**
 * AŞAMA 670 — Event Stream.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('eventstream', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'evs_1', event: "Arena final",
      viewers: "1200", status: 'idle', at: new Date().toISOString() }];
    writeCollection('eventstream', seed);
    return seed;
  }
  return list;
}
export function listEventstream(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEventstream(input, actor = 'system') {
  const row = {
    id: `evs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    event: input.event !== undefined ? input.event : "Arena final",
    viewers: input.viewers !== undefined ? Number(input.viewers) || 0 : 1200,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('eventstream', row, 300);
  appendAudit({
    actor,
    action: 'eventstream.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEventstream(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('eventstream', list);
  appendAudit({ actor, action: 'eventstream.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function eventstreamSummary() {
  const list = listEventstream();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    streaming: list.filter((x) => x.status === 'streaming').length,
    vod: list.filter((x) => x.status === 'vod').length, eventstream: list };
}
