/**
 * AŞAMA 554 — Club Night.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('clubnight', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cln_1', event: "Sunset club",
      pax: "40", status: 'planned', at: new Date().toISOString() }];
    writeCollection('clubnight', seed);
    return seed;
  }
  return list;
}
export function listClubnight(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClubnight(input, actor = 'system') {
  const row = {
    id: `cln_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    event: input.event !== undefined ? input.event : "Sunset club",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 40,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('clubnight', row, 300);
  appendAudit({
    actor,
    action: 'clubnight.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateClubnight(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('clubnight', list);
  appendAudit({ actor, action: 'clubnight.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function clubnightSummary() {
  const list = listClubnight();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, clubnight: list };
}
