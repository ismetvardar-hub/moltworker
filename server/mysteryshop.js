/**
 * AŞAMA 89 — Gizli Müşteri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('mystery-scores', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mys_1',
      venueId: "venue_olympos_beach",
      score: "8",
      
      at: new Date().toISOString(),
    }];
    writeCollection('mystery-scores', seed);
    return seed;
  }
  return list;
}

export function listMysteryshop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createMysteryshop(input, actor = 'system') {
  const row = {
    id: `mys_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    venueId: input.venueId !== undefined ? input.venueId : "venue_olympos_beach",
    score: Number(input.score ?? "8") || 0,
    
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mystery-scores', row, 300);
  appendAudit({
    actor,
    action: 'mysteryshop.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMysteryshop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mystery-scores', list);
  appendAudit({ actor, action: 'mysteryshop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function mysteryshopSummary() {
  const list = listMysteryshop();
  return {
    total: list.length,
    
    scores: list,
  };
}
