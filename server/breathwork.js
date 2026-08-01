/**
 * AŞAMA 473 — Breathwork.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('breathwork', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'brw_1', session: "Box breath",
      pax: "8", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('breathwork', seed);
    return seed;
  }
  return list;
}
export function listBreathwork(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBreathwork(input, actor = 'system') {
  const row = {
    id: `brw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    session: input.session !== undefined ? input.session : "Box breath",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 8,
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('breathwork', row, 300);
  appendAudit({
    actor,
    action: 'breathwork.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBreathwork(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('breathwork', list);
  appendAudit({ actor, action: 'breathwork.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function breathworkSummary() {
  const list = listBreathwork();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    ended: list.filter((x) => x.status === 'ended').length, breathwork: list };
}
