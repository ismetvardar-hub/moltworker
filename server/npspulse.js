/**
 * AŞAMA 550 — NPS Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('npspulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nps_1', score: "9",
      channel: "App", status: 'captured', at: new Date().toISOString() }];
    writeCollection('npspulse', seed);
    return seed;
  }
  return list;
}
export function listNpspulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNpspulse(input, actor = 'system') {
  const row = {
    id: `nps_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    score: input.score !== undefined ? Number(input.score) || 0 : 9,
    channel: input.channel !== undefined ? input.channel : "App",
    status: input.status || 'captured',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('npspulse', row, 300);
  appendAudit({
    actor,
    action: 'npspulse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNpspulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('npspulse', list);
  appendAudit({ actor, action: 'npspulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function npspulseSummary() {
  const list = listNpspulse();
  return { total: list.length, captured: list.filter((x) => x.status === 'captured').length,
    reviewed: list.filter((x) => x.status === 'reviewed').length,
    actioned: list.filter((x) => x.status === 'actioned').length, npspulse: list };
}
