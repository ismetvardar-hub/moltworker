/**
 * AŞAMA 289 — SEO Denetim.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('seoaudit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'seo_1', page: "/pass",
      issue: "Meta", status: 'open', at: new Date().toISOString() }];
    writeCollection('seoaudit', seed);
    return seed;
  }
  return list;
}
export function listSeoaudit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSeoaudit(input, actor = 'system') {
  const row = {
    id: `seo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    page: input.page !== undefined ? input.page : "/pass",
    issue: input.issue !== undefined ? input.issue : "Meta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('seoaudit', row, 300);
  appendAudit({ actor, action: 'seoaudit.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateSeoaudit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('seoaudit', list);
  appendAudit({ actor, action: 'seoaudit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function seoauditSummary() {
  const list = listSeoaudit();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    fixed: list.filter((x) => x.status === 'fixed').length,
    wontfix: list.filter((x) => x.status === 'wontfix').length, seoaudit: list };
}
