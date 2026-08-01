/**
 * AŞAMA 711 — SLA Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('slatrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sla_1', partner: "Alpha",
      score: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('slatrack', seed);
    return seed;
  }
  return list;
}
export function listSlatrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSlatrack(input, actor = 'system') {
  const row = {
    id: `sla_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('slatrack', row, 300);
  appendAudit({
    actor,
    action: 'slatrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSlatrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('slatrack', list);
  appendAudit({ actor, action: 'slatrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function slatrackSummary() {
  const list = listSlatrack();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, slatrack: list };
}
