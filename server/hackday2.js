/**
 * AŞAMA 1015 — Hack Day.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hackday2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hac_1', team: "Alpha",
      idea: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('hackday2', seed);
    return seed;
  }
  return list;
}
export function listHackday2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHackday2(input, actor = 'system') {
  const row = {
    id: `hac_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    team: input.team !== undefined ? input.team : "Alpha",
    idea: input.idea !== undefined ? input.idea : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hackday2', row, 300);
  appendAudit({
    actor,
    action: 'hackday2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHackday2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hackday2', list);
  appendAudit({ actor, action: 'hackday2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hackday2Summary() {
  const list = listHackday2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, hackday2: list };
}
