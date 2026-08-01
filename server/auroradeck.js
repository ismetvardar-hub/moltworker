/**
 * AŞAMA 436 — Aurora Deck.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('auroradeck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aud_1', deck: "West",
      show: "Sunset", status: 'idle', at: new Date().toISOString() }];
    writeCollection('auroradeck', seed);
    return seed;
  }
  return list;
}
export function listAuroradeck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAuroradeck(input, actor = 'system') {
  const row = {
    id: `aud_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    deck: input.deck !== undefined ? input.deck : "West",
    show: input.show !== undefined ? input.show : "Sunset",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('auroradeck', row, 300);
  appendAudit({
    actor,
    action: 'auroradeck.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAuroradeck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('auroradeck', list);
  appendAudit({ actor, action: 'auroradeck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function auroradeckSummary() {
  const list = listAuroradeck();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    rehearsal: list.filter((x) => x.status === 'rehearsal').length,
    live: list.filter((x) => x.status === 'live').length, auroradeck: list };
}
