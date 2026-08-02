/**
 * Wave 176 - Art wall exhibit ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('artwall', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'art_1',
      piece: "Likya Rölyef",
      zone: "Lobby",
      status: 'displayed',
      at: new Date().toISOString(),
    }];
    writeCollection('artwall', seed);
    return seed;
  }
  return list;
}

function openArtwallFlags() {
  const flags = readCollection('artwall-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addArtwallFlag(candidate, actor = 'system') {
  const existing = readCollection('artwall-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('awf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('artwall-flags', list.slice(0, 200));
  return flag;
}

function isStaleExhibit(row) {
  if (row.exhibitStale === true || row.status === 'stale') return true;
  if (!row.lastRotatedAt && !row.displayedAt && !row.at) return false;
  const ts = new Date(row.lastRotatedAt || row.displayedAt || row.at).getTime();
  return Number.isFinite(ts) && ts < Date.now() - 30 * 24 * 60 * 60_000;
}

function isRotatedPiece(row) {
  return row.rotated === true || row.status === 'rotated' || Boolean(row.rotatedAt);
}

function isGalleryNight(row) {
  return row.galleryNight === true || row.eventType === 'gallery_night';
}

export function listArtwall(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createArtwall(input = {}, actor = 'system') {
  const row = {
    id: rid('art'),
    piece: input.piece !== undefined ? input.piece : "Likya Rölyef",
    zone: input.zone !== undefined ? input.zone : "Lobby",
    curator: input.curator !== undefined ? input.curator : undefined,
    eventType: input.eventType !== undefined ? input.eventType : undefined,
    galleryNight: input.galleryNight === true || undefined,
    lastRotatedAt: input.lastRotatedAt !== undefined ? input.lastRotatedAt : undefined,
    displayedAt: input.displayedAt !== undefined ? input.displayedAt : undefined,
    status: input.status || 'displayed',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('artwall', row, 300);
  appendAudit({
    actor,
    action: 'artwall.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateArtwall(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('artwall', list);
  appendAudit({ actor, action: 'artwall.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function artwallSummary() {
  const list = listArtwall();
  const staleExhibits = list.filter(isStaleExhibit);
  const rotatedPieces = list.filter(isRotatedPiece);
  const galleryNights = list.filter(isGalleryNight);
  const flags = openArtwallFlags();
  return {
    title: 'LIKYA Art Wall Ops',
    total: list.length,
    displayed: list.filter((x) => x.status === 'displayed').length,
    stored: list.filter((x) => x.status === 'stored').length,
    loaned: list.filter((x) => x.status === 'loaned').length,
    staleExhibits: staleExhibits.length,
    rotatedPieces: rotatedPieces.length,
    galleryNights: galleryNights.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      displayed: list.filter((x) => x.status === 'displayed').length,
      stored: list.filter((x) => x.status === 'stored').length,
      loaned: list.filter((x) => x.status === 'loaned').length,
      stale_exhibits: staleExhibits.length,
      rotated_pieces: rotatedPieces.length,
      gallery_nights: galleryNights.length,
    },
    summaryLines: [
      `Art wall ${list.length} piece - stale ${staleExhibits.length} - rotated ${rotatedPieces.length}`,
      `Displayed ${list.filter((x) => x.status === 'displayed').length} - gallery night ${galleryNights.length} - flag ${flags.length}`,
    ],
    artwall: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runArtwallSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = artwallSummary();
  const created = [];
  const candidates = [];
  if (force || overview.staleExhibits > 0) {
    candidates.push({
      key: 'artwall_exhibit_stale',
      level: overview.staleExhibits > 0 ? 'warn' : 'info',
      text: `Art wall stale exhibits ${overview.staleExhibits}`,
      domain: 'stale',
    });
  }
  if (force || overview.rotatedPieces === 0) {
    candidates.push({
      key: 'artwall_rotation_needed',
      level: overview.rotatedPieces === 0 ? 'warn' : 'info',
      text: `Art wall rotated pieces ${overview.rotatedPieces}`,
      domain: 'rotation',
    });
  }
  if (force || overview.galleryNights === 0) {
    candidates.push({
      key: 'artwall_gallery_night_seed',
      level: 'info',
      text: `Art wall gallery nights ${overview.galleryNights}`,
      domain: 'event',
    });
  }
  for (const candidate of candidates) {
    const flag = addArtwallFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `artwall sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('aws'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('artwall-sweeps', sweep, 80);
  appendAudit({ actor, action: 'artwall.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: artwallSummary() };
}

export function ackArtwallFlag(input = {}, actor = 'system') {
  const list = readCollection('artwall-flags', []) || [];
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
  writeCollection('artwall-flags', list);
  appendAudit({ actor, action: 'artwall.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: artwallSummary() };
}

export function markArtwallExhibitStale(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.piece && x.piece === input.piece));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isStaleExhibit(x));
  if (idx < 0) return { ok: false, error: 'Stale yapilacak artwall eseri yok' };
  list[idx] = {
    ...list[idx],
    status: 'stale',
    exhibitStale: true,
    staleReason: input.reason || input.staleReason || 'rotation_overdue',
    lastRotatedAt: input.lastRotatedAt || new Date(Date.now() - 45 * 24 * 60 * 60_000).toISOString(),
    staleAt: input.staleAt || new Date().toISOString(),
    staleBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('artwall', list);
  appendAudit({ actor, action: 'artwall.exhibit_stale', detail: list[idx].piece || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, piece: list[idx], overview: artwallSummary() };
}

export function rotateArtwallPiece(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.piece && x.piece === input.piece));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isStaleExhibit(x) || x.status === 'displayed');
  if (idx < 0) {
    const piece = createArtwall({
      piece: input.piece || 'Wave 176 Rotated Piece',
      zone: input.zone || 'Lobby',
      status: 'rotated',
      lastRotatedAt: input.rotatedAt || new Date().toISOString(),
    }, actor);
    return { ok: true, piece, overview: artwallSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'rotated',
    rotated: true,
    zone: input.zone || input.toZone || list[idx].zone,
    exhibitStale: false,
    rotationNote: input.note || input.rotationNote || 'Ops rotation completed',
    rotatedAt: input.rotatedAt || new Date().toISOString(),
    lastRotatedAt: input.rotatedAt || new Date().toISOString(),
    rotatedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('artwall', list);
  appendAudit({ actor, action: 'artwall.rotate', detail: list[idx].piece || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, piece: list[idx], overview: artwallSummary() };
}

export function seedGalleryNight(input = {}, actor = 'system') {
  const piece = createArtwall(
    {
      piece: input.piece || 'Wave 176 Gallery Night',
      zone: input.zone || 'Atrium Gallery',
      curator: input.curator || 'Guest Relations',
      eventType: 'gallery_night',
      galleryNight: true,
      status: input.status || 'displayed',
      displayedAt: input.displayedAt || new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'artwall.seed_gallery_night', detail: piece.piece, meta: { id: piece.id } });
  return { ok: true, piece, overview: artwallSummary() };
}
