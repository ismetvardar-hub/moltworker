/**
 * AŞAMA 563 — SEO Page.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('seopage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'seo_1', url: "/olympos",
      score: "78", status: 'tracked', at: new Date().toISOString() }];
    writeCollection('seopage', seed);
    return seed;
  }
  return list;
}
export function listSeopage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSeopage(input, actor = 'system') {
  const row = {
    id: `seo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    url: input.url !== undefined ? input.url : "/olympos",
    score: input.score !== undefined ? Number(input.score) || 0 : 78,
    status: input.status || 'tracked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('seopage', row, 300);
  appendAudit({
    actor,
    action: 'seopage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSeopage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('seopage', list);
  appendAudit({ actor, action: 'seopage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function seopageSummary() {
  const list = listSeopage();
  return { total: list.length, tracked: list.filter((x) => x.status === 'tracked').length,
    improved: list.filter((x) => x.status === 'improved').length,
    issue: list.filter((x) => x.status === 'issue').length, seopage: list };
}
