/**
 * AŞAMA 560 — UTM Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('utmtrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'utm_1', source: "newsletter",
      campaign: "August", status: 'active', at: new Date().toISOString() }];
    writeCollection('utmtrack', seed);
    return seed;
  }
  return list;
}
export function listUtmtrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUtmtrack(input, actor = 'system') {
  const row = {
    id: `utm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    source: input.source !== undefined ? input.source : "newsletter",
    campaign: input.campaign !== undefined ? input.campaign : "August",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('utmtrack', row, 300);
  appendAudit({
    actor,
    action: 'utmtrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateUtmtrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('utmtrack', list);
  appendAudit({ actor, action: 'utmtrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function utmtrackSummary() {
  const list = listUtmtrack();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    converted: list.filter((x) => x.status === 'converted').length,
    dead: list.filter((x) => x.status === 'dead').length, utmtrack: list };
}
