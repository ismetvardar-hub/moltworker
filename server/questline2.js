/**
 * AŞAMA 998 — Quest Line.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('questline2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'que_1', quest: "Alpha",
      progress: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('questline2', seed);
    return seed;
  }
  return list;
}
export function listQuestline2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createQuestline2(input, actor = 'system') {
  const row = {
    id: `que_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    quest: input.quest !== undefined ? input.quest : "Alpha",
    progress: input.progress !== undefined ? Number(input.progress) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('questline2', row, 300);
  appendAudit({
    actor,
    action: 'questline2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateQuestline2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('questline2', list);
  appendAudit({ actor, action: 'questline2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function questline2Summary() {
  const list = listQuestline2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, questline2: list };
}
