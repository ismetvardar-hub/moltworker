/**
 * AŞAMA 83 — Sürdürülebilirlik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('sustain-metrics', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'sus_1',
      metric: "plastic_kg",
      value: "12",
      
      at: new Date().toISOString(),
    }];
    writeCollection('sustain-metrics', seed);
    return seed;
  }
  return list;
}

export function listSustain(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createSustain(input, actor = 'system') {
  const row = {
    id: `sus_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "plastic_kg",
    value: Number(input.value ?? "12") || 0,
    
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sustain-metrics', row, 300);
  appendAudit({
    actor,
    action: 'sustain.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateSustain(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sustain-metrics', list);
  appendAudit({ actor, action: 'sustain.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function sustainSummary() {
  const list = listSustain();
  return {
    total: list.length,
    
    entries: list,
  };
}
