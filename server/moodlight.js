/**
 * AŞAMA 440 — Mood Light.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('moodlight', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mdl_1', zone: "Lounge",
      mood: "Amber", status: 'set', at: new Date().toISOString() }];
    writeCollection('moodlight', seed);
    return seed;
  }
  return list;
}
export function listMoodlight(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMoodlight(input, actor = 'system') {
  const row = {
    id: `mdl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Lounge",
    mood: input.mood !== undefined ? input.mood : "Amber",
    status: input.status || 'set',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('moodlight', row, 300);
  appendAudit({
    actor,
    action: 'moodlight.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMoodlight(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('moodlight', list);
  appendAudit({ actor, action: 'moodlight.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function moodlightSummary() {
  const list = listMoodlight();
  return { total: list.length, set: list.filter((x) => x.status === 'set').length,
    fade: list.filter((x) => x.status === 'fade').length,
    off: list.filter((x) => x.status === 'off').length, moodlight: list };
}
