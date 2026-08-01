/**
 * AŞAMA 286 — Basın Kiti.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('presskit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prk_1', asset: "Logo pack",
      channel: "Press", status: 'draft', at: new Date().toISOString() }];
    writeCollection('presskit', seed);
    return seed;
  }
  return list;
}
export function listPresskit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPresskit(input, actor = 'system') {
  const row = {
    id: `prk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Logo pack",
    channel: input.channel !== undefined ? input.channel : "Press",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('presskit', row, 300);
  appendAudit({ actor, action: 'presskit.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updatePresskit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('presskit', list);
  appendAudit({ actor, action: 'presskit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function presskitSummary() {
  const list = listPresskit();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    archived: list.filter((x) => x.status === 'archived').length, presskit: list };
}
