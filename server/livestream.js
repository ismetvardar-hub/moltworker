/**
 * AŞAMA 293 — Canlı Yayın.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('livestream', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lvs_1', title: "Sunset DJ",
      platform: "YT", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('livestream', seed);
    return seed;
  }
  return list;
}
export function listLivestream(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLivestream(input, actor = 'system') {
  const row = {
    id: `lvs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Sunset DJ",
    platform: input.platform !== undefined ? input.platform : "YT",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('livestream', row, 300);
  appendAudit({ actor, action: 'livestream.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateLivestream(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('livestream', list);
  appendAudit({ actor, action: 'livestream.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function livestreamSummary() {
  const list = listLivestream();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    live: list.filter((x) => x.status === 'live').length,
    ended: list.filter((x) => x.status === 'ended').length, livestream: list };
}
