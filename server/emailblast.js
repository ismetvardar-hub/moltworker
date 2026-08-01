/**
 * AŞAMA 565 — Email Blast.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('emailblast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'emb_1', subject: "August rates",
      list: "Guests", status: 'draft', at: new Date().toISOString() }];
    writeCollection('emailblast', seed);
    return seed;
  }
  return list;
}
export function listEmailblast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEmailblast(input, actor = 'system') {
  const row = {
    id: `emb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    subject: input.subject !== undefined ? input.subject : "August rates",
    list: input.list !== undefined ? input.list : "Guests",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('emailblast', row, 300);
  appendAudit({
    actor,
    action: 'emailblast.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEmailblast(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('emailblast', list);
  appendAudit({ actor, action: 'emailblast.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function emailblastSummary() {
  const list = listEmailblast();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    sending: list.filter((x) => x.status === 'sending').length,
    sent: list.filter((x) => x.status === 'sent').length, emailblast: list };
}
