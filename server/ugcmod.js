/**
 * AŞAMA 288 — UGC Moderasyon.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ugcmod', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ugc_1', author: "Misafir",
      platform: "IG", status: 'queued', at: new Date().toISOString() }];
    writeCollection('ugcmod', seed);
    return seed;
  }
  return list;
}
export function listUgcmod(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUgcmod(input, actor = 'system') {
  const row = {
    id: `ugc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    author: input.author !== undefined ? input.author : "Misafir",
    platform: input.platform !== undefined ? input.platform : "IG",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ugcmod', row, 300);
  appendAudit({ actor, action: 'ugcmod.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateUgcmod(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ugcmod', list);
  appendAudit({ actor, action: 'ugcmod.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ugcmodSummary() {
  const list = listUgcmod();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, ugcmod: list };
}
