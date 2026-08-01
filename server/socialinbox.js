/**
 * AŞAMA 297 — Sosyal Inbox.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('socialinbox', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sin_1', platform: "IG",
      message: "Rezervasyon?", status: 'new', at: new Date().toISOString() }];
    writeCollection('socialinbox', seed);
    return seed;
  }
  return list;
}
export function listSocialinbox(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSocialinbox(input, actor = 'system') {
  const row = {
    id: `sin_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    platform: input.platform !== undefined ? input.platform : "IG",
    message: input.message !== undefined ? input.message : "Rezervasyon?",
    status: input.status || 'new',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('socialinbox', row, 300);
  appendAudit({ actor, action: 'socialinbox.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateSocialinbox(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('socialinbox', list);
  appendAudit({ actor, action: 'socialinbox.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function socialinboxSummary() {
  const list = listSocialinbox();
  return { total: list.length, new: list.filter((x) => x.status === 'new').length,
    replied: list.filter((x) => x.status === 'replied').length,
    escalated: list.filter((x) => x.status === 'escalated').length, socialinbox: list };
}
