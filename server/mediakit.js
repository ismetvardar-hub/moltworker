/**
 * AŞAMA 82 — Medya Kiti.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('media-kit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'med_1',
      title: "Kit öğesi",
      channel: "press",
      status: 'draft',
      at: new Date().toISOString(),
    }];
    writeCollection('media-kit', seed);
    return seed;
  }
  return list;
}

export function listMediakit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createMediakit(input, actor = 'system') {
  const row = {
    id: `med_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Kit öğesi",
    channel: input.channel !== undefined ? input.channel : "press",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('media-kit', row, 300);
  appendAudit({
    actor,
    action: 'mediakit.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMediakit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('media-kit', list);
  appendAudit({ actor, action: 'mediakit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function mediakitSummary() {
  const list = listMediakit();
  return {
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    ready: list.filter((x) => x.status === 'ready').length,
    assets: list,
  };
}
