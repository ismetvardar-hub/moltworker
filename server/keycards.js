/**
 * Wave 166 - Keycard access lifecycle ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('keycards', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'key_1',
      room: '101',
      guestName: 'Misafir',
      status: 'queued',
      accessUntil: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('keycards', seed);
    return seed;
  }
  return list;
}

function openKeycardsFlags() {
  const flags = readCollection('keycards-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addKeycardsFlag(candidate, actor = 'system') {
  const existing = readCollection('keycards-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('kcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('keycards-flags', list.slice(0, 200));
  return flag;
}

function isExpiredAccess(row) {
  if (row.status === 'expired') return true;
  const until = Date.parse(row.accessUntil || row.expiresAt || row.until || '');
  return Number.isFinite(until) && until < Date.now() && row.status !== 'void' && row.status !== 'reissued';
}

export function listKeycards(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createKeycards(input = {}, actor = 'system') {
  const row = {
    id: `key_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : '101',
    guestName: input.guestName !== undefined ? input.guestName : 'Misafir',
    cardNo: input.cardNo || input.code || null,
    accessUntil: input.accessUntil || input.expiresAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    status: input.status || 'queued',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('keycards', row, 300);
  appendAudit({
    actor,
    action: 'keycards.create',
    detail: String(row.guestName || row.room || row.cardNo || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateKeycards(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('keycards', list);
  appendAudit({ actor, action: 'keycards.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function keycardsSummary() {
  const list = listKeycards();
  const expiredAccess = list.filter(isExpiredAccess);
  const lost = list.filter((x) => x.status === 'lost' || x.lost === true);
  const reissued = list.filter((x) => x.status === 'reissued' || x.reissuedAt);
  const flags = openKeycardsFlags();
  return {
    title: 'LIKYA Keycard Ops',
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    encoded: list.filter((x) => x.status === 'encoded').length,
    void: list.filter((x) => x.status === 'void').length,
    expired: expiredAccess.length,
    lost: lost.length,
    reissued: reissued.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      queued: list.filter((x) => x.status === 'queued').length,
      encoded: list.filter((x) => x.status === 'encoded').length,
      void: list.filter((x) => x.status === 'void').length,
      expired_access: expiredAccess.length,
      lost: lost.length,
      reissued: reissued.length,
    },
    summaryLines: [
      `Keycards ${list.length} card - queued ${list.filter((x) => x.status === 'queued').length} - expired ${expiredAccess.length}`,
      `Lost ${lost.length} - reissued ${reissued.length} - flag ${flags.length}`,
    ],
    keycards: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runKeycardsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = keycardsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.expired > 0) {
    candidates.push({
      key: 'keycards_expired_access',
      level: overview.expired > 0 ? 'warn' : 'info',
      text: `Expired keycard access ${overview.expired}`,
      domain: 'access',
    });
  }
  if (force || overview.lost > 0) {
    candidates.push({
      key: 'keycards_lost_card',
      level: overview.lost > 0 ? 'alert' : 'info',
      text: `Lost keycard ${overview.lost}`,
      domain: 'security',
    });
  }
  if (force || overview.queued > 0) {
    candidates.push({
      key: 'keycards_encode_queue',
      level: overview.queued > 5 ? 'warn' : 'info',
      text: `Keycards waiting encode ${overview.queued}`,
      domain: 'frontdesk',
    });
  }
  for (const candidate of candidates) {
    const flag = addKeycardsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `keycards sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('kcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('keycards-sweeps', sweep, 80);
  appendAudit({ actor, action: 'keycards.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: keycardsSummary() };
}

export function ackKeycardsFlag(input = {}, actor = 'system') {
  const list = readCollection('keycards-flags', []) || [];
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
  writeCollection('keycards-flags', list);
  appendAudit({ actor, action: 'keycards.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: keycardsSummary() };
}

export function expireKeycardAccess(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'encoded' || x.status === 'queued');
  if (idx < 0) return { ok: false, error: 'Expire edilecek keycard yok' };
  list[idx] = {
    ...list[idx],
    status: 'expired',
    accessUntil: input.accessUntil || new Date(Date.now() - 60_000).toISOString(),
    expiredReason: input.reason || input.expiredReason || 'Access window expired',
    expiredAt: input.expiredAt || new Date().toISOString(),
    expiredBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('keycards', list);
  appendAudit({ actor, action: 'keycards.access_expire', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, keycard: list[idx], overview: keycardsSummary() };
}

export function reissueKeycard(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'lost' || x.status === 'expired' || x.status === 'void');
  if (idx < 0) return { ok: false, error: 'Reissue edilecek keycard yok' };
  list[idx] = {
    ...list[idx],
    status: 'reissued',
    lost: false,
    previousCardNo: list[idx].cardNo || null,
    cardNo: input.cardNo || `KC-${randomBytes(2).toString('hex').toUpperCase()}`,
    accessUntil: input.accessUntil || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    reissuedAt: input.reissuedAt || new Date().toISOString(),
    reissuedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('keycards', list);
  appendAudit({ actor, action: 'keycards.reissue', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, keycard: list[idx], overview: keycardsSummary() };
}

export function seedLostKeycard(input = {}, actor = 'system') {
  const keycard = createKeycards(
    {
      room: input.room || '219',
      guestName: input.guestName || 'Lost card guest',
      cardNo: input.cardNo || `LOST-${randomBytes(2).toString('hex').toUpperCase()}`,
      status: 'lost',
      accessUntil: input.accessUntil || new Date(Date.now() + 6 * 60 * 60_000).toISOString(),
      at: input.at || new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'keycards.seed_lost_card', detail: keycard.room, meta: { id: keycard.id } });
  return { ok: true, keycard, overview: keycardsSummary() };
}
