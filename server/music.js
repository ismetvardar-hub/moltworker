/**
 * AŞAMA 50 — Mekan müzik / playlist istekleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

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

function openMusicFlags() {
  const flags = readCollection('music-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMusicFlag(candidate, actor = 'system') {
  const existing = readCollection('music-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('musf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('music-flags', list.slice(0, 200));
  return flag;
}

function isZoneSilence(row) {
  return row.status === 'silence' || row.status === 'silent' || row.silence === true;
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
  const silenceZones = list.filter(isZoneSilence);
  const playlists = list.filter((m) => m.playlist || m.playlistName);
  const flags = openMusicFlags();
  return {
    title: 'LIKYA Music Ops',
    queued: list.filter((m) => m.status === 'queued').length,
    playing: list.filter((m) => m.status === 'playing').length,
    done: list.filter((m) => m.status === 'done').length,
    silenceZones: silenceZones.length,
    playlists: playlists.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      queued: list.filter((m) => m.status === 'queued').length,
      playing: list.filter((m) => m.status === 'playing').length,
      done: list.filter((m) => m.status === 'done').length,
      silence_zones: silenceZones.length,
      playlists: playlists.length,
    },
    summaryLines: [
      `Music ${list.length} request - queued ${list.filter((m) => m.status === 'queued').length} - playing ${list.filter((m) => m.status === 'playing').length}`,
      `Zone silence ${silenceZones.length} - playlists ${playlists.length} - flag ${flags.length}`,
    ],
    total: list.length,
  };
}

export function runMusicSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = musicSummary();
  const created = [];
  const candidates = [];
  if (force || overview.silenceZones > 0) {
    candidates.push({
      key: 'music_zone_silence',
      level: overview.silenceZones > 0 ? 'warn' : 'info',
      text: `Music zone silence ${overview.silenceZones}`,
      domain: 'zone',
    });
  }
  if (force || overview.queued > 0) {
    candidates.push({
      key: 'music_queue_flow',
      level: 'info',
      text: `Music queued requests ${overview.queued}`,
      domain: 'queue',
    });
  }
  if (force || overview.playlists > 0) {
    candidates.push({
      key: 'music_playlist_set',
      level: 'info',
      text: `Music playlists set ${overview.playlists}`,
      domain: 'playlist',
    });
  }
  for (const candidate of candidates) {
    const flag = addMusicFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `music sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('muss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('music-sweeps', sweep, 80);
  appendAudit({ actor, action: 'music.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: musicSummary() };
}

export function ackMusicFlag(input = {}, actor = 'system') {
  const list = readCollection('music-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('music-flags', list);
  appendAudit({ actor, action: 'music.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: musicSummary() };
}

export function markMusicZoneSilence(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((m) => m.id === input.id || (input.zone && m.zone === input.zone));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((m) => m.status === 'queued' || m.status === 'playing');
  if (idx < 0) return { ok: false, error: 'Silence yapilacak music zone yok' };
  list[idx] = {
    ...list[idx],
    status: 'silence',
    silence: true,
    zone: input.zone || list[idx].zone || 'Sunset lounge',
    silenceAt: input.silenceAt || new Date().toISOString(),
    silenceBy: actor,
    reason: input.reason || list[idx].reason || 'Zone silence',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('music-requests', list);
  appendAudit({ actor, action: 'music.zone_silence', detail: list[idx].zone || list[idx].title, meta: { id: list[idx].id } });
  return { ok: true, music: list[idx], overview: musicSummary() };
}

export function setMusicPlaylist(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((m) => m.id === input.id || (input.zone && m.zone === input.zone));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((m) => m.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Playlist set edilecek music zone yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'playing',
    silence: false,
    zone: input.zone || list[idx].zone || 'Sunset lounge',
    playlist: input.playlist || input.playlistName || 'LIKYA lounge rotation',
    playlistName: input.playlistName || input.playlist || 'LIKYA lounge rotation',
    playlistSetAt: input.playlistSetAt || new Date().toISOString(),
    playlistSetBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('music-requests', list);
  appendAudit({ actor, action: 'music.playlist_set', detail: list[idx].playlistName || list[idx].title, meta: { id: list[idx].id } });
  return { ok: true, music: list[idx], overview: musicSummary() };
}

export function seedSunsetMix(input = {}, actor = 'system') {
  const music = createMusicRequest(
    {
      title: input.title || 'Sunset Mix',
      artist: input.artist || 'DJ Phaselis',
      venueId: input.venueId || 'venue_olympos_beach',
      requestedBy: input.requestedBy || actor,
    },
    actor,
  );
  const patched = updateMusicRequest(
    music.id,
    {
      zone: input.zone || 'Sunset lounge',
      playlist: input.playlist || 'Sunset Mix',
      playlistName: input.playlistName || input.playlist || 'Sunset Mix',
      mixType: 'sunset',
      status: input.status || 'queued',
    },
    actor,
  );
  appendAudit({ actor, action: 'music.seed_sunset_mix', detail: music.title, meta: { id: music.id } });
  return { ok: true, music: patched || music, overview: musicSummary() };
}
