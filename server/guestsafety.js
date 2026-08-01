/**
 * AŞAMA 524 — Guest Safety.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guestsafety', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gsf_1', topic: "Cliff path",
      pax: "20", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('guestsafety', seed);
    return seed;
  }
  return list;
}
export function listGuestsafety(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuestsafety(input, actor = 'system') {
  const row = {
    id: `gsf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Cliff path",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 20,
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestsafety', row, 300);
  appendAudit({
    actor,
    action: 'guestsafety.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuestsafety(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestsafety', list);
  appendAudit({ actor, action: 'guestsafety.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guestsafetySummary() {
  const list = listGuestsafety();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    acked: list.filter((x) => x.status === 'acked').length, guestsafety: list };
}
