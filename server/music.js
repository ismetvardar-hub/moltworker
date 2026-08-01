/**
 * AŞAMA 50 — Mekan müzik / playlist istekleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('music-requests', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'mus_1',
        title: 'Sunset Lounge Mix',
        artist: 'DJ Phaselis',
        venueId: 'venue_olympos_beach',
        status: 'queued',
        requestedBy: 'vision',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('music-requests', seed);
    return seed;
  }
  return list;
}

export function listMusic(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((m) => m.status === filter.status);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createMusicRequest(input, actor = 'system') {
  const req = {
    id: `mus_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || '').trim() || 'İstek',
    artist: input.artist || '',
    venueId: input.venueId || 'venue_olympos_beach',
    status: 'queued',
    requestedBy: input.requestedBy || actor,
    at: new Date().toISOString(),
  };
  prependItem('music-requests', req, 200);
  appendAudit({
    actor,
    action: 'music.request',
    detail: `${req.title} — ${req.artist || 'bilinmeyen'}`,
    meta: { id: req.id },
  });
  return req;
}

export function updateMusicRequest(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('music-requests', list);
  appendAudit({
    actor,
    action: 'music.update',
    detail: `${list[idx].title} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function musicSummary() {
  const list = listMusic();
  return {
    queued: list.filter((m) => m.status === 'queued').length,
    playing: list.filter((m) => m.status === 'playing').length,
    total: list.length,
  };
}
