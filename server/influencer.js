/**
 * AŞAMA 287 — Influencer.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('influencer', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inf_1', handle: "@travel",
      reach: "50000", status: 'pitched', at: new Date().toISOString() }];
    writeCollection('influencer', seed);
    return seed;
  }
  return list;
}
export function listInfluencer(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInfluencer(input, actor = 'system') {
  const row = {
    id: `inf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    handle: input.handle !== undefined ? input.handle : "@travel",
    reach: input.reach !== undefined ? Number(input.reach) || 0 : 50000,
    status: input.status || 'pitched',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('influencer', row, 300);
  appendAudit({ actor, action: 'influencer.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateInfluencer(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('influencer', list);
  appendAudit({ actor, action: 'influencer.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function influencerSummary() {
  const list = listInfluencer();
  return { total: list.length, pitched: list.filter((x) => x.status === 'pitched').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, influencer: list };
}
