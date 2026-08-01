/**
 * AŞAMA 84 — Alerjen Matrisi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('allergens', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'all_1',
      dish: "Köfte menü",
      flags: "gluten",
      
      at: new Date().toISOString(),
    }];
    writeCollection('allergens', seed);
    return seed;
  }
  return list;
}

export function listAllergens(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createAllergens(input, actor = 'system') {
  const row = {
    id: `all_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dish: input.dish !== undefined ? input.dish : "Köfte menü",
    flags: input.flags !== undefined ? input.flags : "gluten",
    
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('allergens', row, 300);
  appendAudit({
    actor,
    action: 'allergens.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateAllergens(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('allergens', list);
  appendAudit({ actor, action: 'allergens.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function allergensSummary() {
  const list = listAllergens();
  return {
    total: list.length,
    
    rows: list,
  };
}
