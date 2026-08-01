/**
 * AŞAMA 1153 — Story Wall.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('storywall3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sto_1', story: "Alpha",
      author: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('storywall3', seed);
    return seed;
  }
  return list;
}
export function listStorywall3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStorywall3(input, actor = 'system') {
  const row = {
    id: `sto_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    story: input.story !== undefined ? input.story : "Alpha",
    author: input.author !== undefined ? input.author : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('storywall3', row, 300);
  appendAudit({
    actor,
    action: 'storywall3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStorywall3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('storywall3', list);
  appendAudit({ actor, action: 'storywall3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function storywall3Summary() {
  const list = listStorywall3();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, storywall3: list };
}
