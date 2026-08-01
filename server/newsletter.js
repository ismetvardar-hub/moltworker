/**
 * AŞAMA 295 — Bülten.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('newsletter', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nws_1', subject: "Haftalık",
      segment: "VIP", status: 'draft', at: new Date().toISOString() }];
    writeCollection('newsletter', seed);
    return seed;
  }
  return list;
}
export function listNewsletter(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNewsletter(input, actor = 'system') {
  const row = {
    id: `nws_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    subject: input.subject !== undefined ? input.subject : "Haftalık",
    segment: input.segment !== undefined ? input.segment : "VIP",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('newsletter', row, 300);
  appendAudit({ actor, action: 'newsletter.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateNewsletter(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('newsletter', list);
  appendAudit({ actor, action: 'newsletter.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function newsletterSummary() {
  const list = listNewsletter();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    sent: list.filter((x) => x.status === 'sent').length, newsletter: list };
}
