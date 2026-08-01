/**
 * AŞAMA 294 — Podcast.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('podcastshow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pod_1', episode: "E01",
      guest: "Şef", status: 'planned', at: new Date().toISOString() }];
    writeCollection('podcastshow', seed);
    return seed;
  }
  return list;
}
export function listPodcastshow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPodcastshow(input, actor = 'system') {
  const row = {
    id: `pod_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    episode: input.episode !== undefined ? input.episode : "E01",
    guest: input.guest !== undefined ? input.guest : "Şef",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('podcastshow', row, 300);
  appendAudit({ actor, action: 'podcastshow.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updatePodcastshow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('podcastshow', list);
  appendAudit({ actor, action: 'podcastshow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function podcastshowSummary() {
  const list = listPodcastshow();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    recorded: list.filter((x) => x.status === 'recorded').length,
    published: list.filter((x) => x.status === 'published').length, podcastshow: list };
}
