/**
 * AŞAMA 296 — Hashtag Harita.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tagmap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tag_1', tag: "#Likya",
      campaign: "Summer", status: 'active', at: new Date().toISOString() }];
    writeCollection('tagmap', seed);
    return seed;
  }
  return list;
}
export function listTagmap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTagmap(input, actor = 'system') {
  const row = {
    id: `tag_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tag: input.tag !== undefined ? input.tag : "#Likya",
    campaign: input.campaign !== undefined ? input.campaign : "Summer",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tagmap', row, 300);
  appendAudit({ actor, action: 'tagmap.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateTagmap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tagmap', list);
  appendAudit({ actor, action: 'tagmap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tagmapSummary() {
  const list = listTagmap();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length, tagmap: list };
}
