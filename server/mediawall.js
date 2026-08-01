/**
 * AŞAMA 661 — Media Wall.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mediawall', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mdw_1', screen: "Lobby LED",
      clip: "Sunset reel", status: 'queued', at: new Date().toISOString() }];
    writeCollection('mediawall', seed);
    return seed;
  }
  return list;
}
export function listMediawall(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMediawall(input, actor = 'system') {
  const row = {
    id: `mdw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    screen: input.screen !== undefined ? input.screen : "Lobby LED",
    clip: input.clip !== undefined ? input.clip : "Sunset reel",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mediawall', row, 300);
  appendAudit({
    actor,
    action: 'mediawall.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMediawall(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mediawall', list);
  appendAudit({ actor, action: 'mediawall.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mediawallSummary() {
  const list = listMediawall();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    playing: list.filter((x) => x.status === 'playing').length,
    done: list.filter((x) => x.status === 'done').length, mediawall: list };
}
