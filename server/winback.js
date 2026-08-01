/**
 * AŞAMA 553 — Winback.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('winback', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wnb_1', segment: "Lapsed Gold",
      offer: "2 nights", status: 'draft', at: new Date().toISOString() }];
    writeCollection('winback', seed);
    return seed;
  }
  return list;
}
export function listWinback(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWinback(input, actor = 'system') {
  const row = {
    id: `wnb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    segment: input.segment !== undefined ? input.segment : "Lapsed Gold",
    offer: input.offer !== undefined ? input.offer : "2 nights",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('winback', row, 300);
  appendAudit({
    actor,
    action: 'winback.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWinback(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('winback', list);
  appendAudit({ actor, action: 'winback.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function winbackSummary() {
  const list = listWinback();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    won: list.filter((x) => x.status === 'won').length, winback: list };
}
