/**
 * AŞAMA 292 — Storyboard.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('storyboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stb_1', title: "Sahil film",
      frames: "8", status: 'draft', at: new Date().toISOString() }];
    writeCollection('storyboard', seed);
    return seed;
  }
  return list;
}
export function listStoryboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStoryboard(input, actor = 'system') {
  const row = {
    id: `stb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Sahil film",
    frames: input.frames !== undefined ? Number(input.frames) || 0 : 8,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('storyboard', row, 300);
  appendAudit({ actor, action: 'storyboard.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateStoryboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('storyboard', list);
  appendAudit({ actor, action: 'storyboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function storyboardSummary() {
  const list = listStoryboard();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    review: list.filter((x) => x.status === 'review').length,
    approved: list.filter((x) => x.status === 'approved').length, storyboard: list };
}
