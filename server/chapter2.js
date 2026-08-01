/**
 * AŞAMA 1001 — Chapter.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('chapter2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cha_1', city: "Alpha",
      lead: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('chapter2', seed);
    return seed;
  }
  return list;
}
export function listChapter2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChapter2(input, actor = 'system') {
  const row = {
    id: `cha_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    city: input.city !== undefined ? input.city : "Alpha",
    lead: input.lead !== undefined ? input.lead : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('chapter2', row, 300);
  appendAudit({
    actor,
    action: 'chapter2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChapter2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('chapter2', list);
  appendAudit({ actor, action: 'chapter2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function chapter2Summary() {
  const list = listChapter2();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, chapter2: list };
}
