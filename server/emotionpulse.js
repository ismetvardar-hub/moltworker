/**
 * AŞAMA 354 — Duygu Nabız.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('emotionpulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'emp_1', zone: "Lobby",
      score: "8", status: 'calm', at: new Date().toISOString() }];
    writeCollection('emotionpulse', seed);
    return seed;
  }
  return list;
}
export function listEmotionpulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEmotionpulse(input, actor = 'system') {
  const row = {
    id: `emp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Lobby",
    score: input.score !== undefined ? Number(input.score) || 0 : 8,
    status: input.status || 'calm',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('emotionpulse', row, 300);
  appendAudit({
    actor,
    action: 'emotionpulse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEmotionpulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('emotionpulse', list);
  appendAudit({ actor, action: 'emotionpulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function emotionpulseSummary() {
  const list = listEmotionpulse();
  return { total: list.length, calm: list.filter((x) => x.status === 'calm').length,
    mixed: list.filter((x) => x.status === 'mixed').length,
    alert: list.filter((x) => x.status === 'alert').length, emotionpulse: list };
}
