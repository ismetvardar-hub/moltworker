/**
 * AŞAMA 349 — Next Best Action.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nextbest', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nba_1', guestName: "Misafir",
      action: "Spa upsell", status: 'suggested', at: new Date().toISOString() }];
    writeCollection('nextbest', seed);
    return seed;
  }
  return list;
}
export function listNextbest(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNextbest(input, actor = 'system') {
  const row = {
    id: `nba_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    action: input.action !== undefined ? input.action : "Spa upsell",
    status: input.status || 'suggested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nextbest', row, 300);
  appendAudit({
    actor,
    action: 'nextbest.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNextbest(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nextbest', list);
  appendAudit({ actor, action: 'nextbest.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nextbestSummary() {
  const list = listNextbest();
  return { total: list.length, suggested: list.filter((x) => x.status === 'suggested').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    dismissed: list.filter((x) => x.status === 'dismissed').length, nextbest: list };
}
