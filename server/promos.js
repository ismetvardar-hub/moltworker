/**
 * Wave 175 - Promo code ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('promos', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'prm_1',
      code: "LIKYA10",
      discount: "10",
      status: 'active',
      at: new Date().toISOString(),
    }];
    writeCollection('promos', seed);
    return seed;
  }
  return list;
}

function openPromosFlags() {
  const flags = readCollection('promos-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPromosFlag(candidate, actor = 'system') {
  const existing = readCollection('promos-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('prf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('promos-flags', list.slice(0, 200));
  return flag;
}

function isExpiredLiveCode(row) {
  if (row.expiredLive === true || row.status === 'expired_live') return true;
  if (row.status !== 'active' && row.status !== 'live') return false;
  if (!row.expiresAt && !row.until) return false;
  const expires = new Date(row.expiresAt || row.until).getTime();
  return Number.isFinite(expires) && expires < Date.now();
}

function isFlashPromo(row) {
  return row.flashPromo === true || row.promoType === 'flash';
}

export function listPromos(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPromos(input = {}, actor = 'system') {
  const row = {
    id: rid('prm'),
    code: input.code !== undefined ? input.code : "LIKYA10",
    discount: input.discount !== undefined ? Number(input.discount) || 0 : 10,
    channel: input.channel !== undefined ? input.channel : undefined,
    expiresAt: input.expiresAt !== undefined ? input.expiresAt : undefined,
    until: input.until !== undefined ? input.until : undefined,
    promoType: input.promoType !== undefined ? input.promoType : undefined,
    flashPromo: input.flashPromo === true || undefined,
    status: input.status || 'active',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('promos', row, 300);
  appendAudit({
    actor,
    action: 'promos.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePromos(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.discount !== undefined) next.discount = Number(next.discount) || 0;
  list[idx] = next;
  writeCollection('promos', list);
  appendAudit({ actor, action: 'promos.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function promosSummary() {
  const list = listPromos();
  const expiredLiveCodes = list.filter(isExpiredLiveCode);
  const flashPromos = list.filter(isFlashPromo);
  const flags = openPromosFlags();
  return {
    title: 'LIKYA Promo Code Ops',
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    expired: list.filter((x) => x.status === 'expired').length,
    expiredLiveCodes: expiredLiveCodes.length,
    flashPromos: flashPromos.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => x.status === 'active').length,
      paused: list.filter((x) => x.status === 'paused').length,
      expired: list.filter((x) => x.status === 'expired').length,
      expired_live_codes: expiredLiveCodes.length,
      flash_promos: flashPromos.length,
    },
    summaryLines: [
      `Promos ${list.length} code - expired live ${expiredLiveCodes.length} - paused ${list.filter((x) => x.status === 'paused').length}`,
      `Active ${list.filter((x) => x.status === 'active').length} - flash promos ${flashPromos.length} - flag ${flags.length}`,
    ],
    promos: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPromosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = promosSummary();
  const created = [];
  const candidates = [];
  if (force || overview.expiredLiveCodes > 0) {
    candidates.push({
      key: 'promos_expired_live_code',
      level: overview.expiredLiveCodes > 0 ? 'warn' : 'info',
      text: `Promo expired live codes ${overview.expiredLiveCodes}`,
      domain: 'expiry',
    });
  }
  if (force || overview.paused === 0) {
    candidates.push({
      key: 'promos_pause_needed',
      level: overview.paused === 0 ? 'warn' : 'info',
      text: `Promo paused codes ${overview.paused}`,
      domain: 'pause',
    });
  }
  if (force || overview.flashPromos === 0) {
    candidates.push({
      key: 'promos_flash_promo_seed',
      level: 'info',
      text: `Promo flash rows ${overview.flashPromos}`,
      domain: 'flash',
    });
  }
  for (const candidate of candidates) {
    const flag = addPromosFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `promos sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('prs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('promos-sweeps', sweep, 80);
  appendAudit({ actor, action: 'promos.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: promosSummary() };
}

export function ackPromosFlag(input = {}, actor = 'system') {
  const list = readCollection('promos-flags', []) || [];
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
  writeCollection('promos-flags', list);
  appendAudit({ actor, action: 'promos.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: promosSummary() };
}

export function markPromoExpiredLiveCode(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'active' || x.status === 'live');
  if (idx < 0) return { ok: false, error: 'Expired live yapilacak promo yok' };
  list[idx] = {
    ...list[idx],
    status: 'expired_live',
    expiredLive: true,
    expiresAt: input.expiresAt || new Date(Date.now() - 60 * 60_000).toISOString(),
    expiredReason: input.reason || input.expiredReason || 'end_date_passed',
    expiredAt: input.expiredAt || new Date().toISOString(),
    expiredBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('promos', list);
  appendAudit({ actor, action: 'promos.expired_live', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, promo: list[idx], overview: promosSummary() };
}

export function pausePromo(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'active' || x.status === 'live' || isExpiredLiveCode(x));
  if (idx < 0) {
    const promo = createPromos({
      code: input.code || 'PAUSE175',
      discount: input.discount ?? 15,
      status: 'paused',
      channel: input.channel || 'direct',
    }, actor);
    return { ok: true, promo, overview: promosSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'paused',
    pausedReason: input.reason || input.pausedReason || 'ops_review',
    pausedAt: input.pausedAt || new Date().toISOString(),
    pausedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('promos', list);
  appendAudit({ actor, action: 'promos.pause', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, promo: list[idx], overview: promosSummary() };
}

export function seedFlashPromo(input = {}, actor = 'system') {
  const promo = createPromos(
    {
      code: input.code || 'FLASH175',
      discount: input.discount ?? 25,
      channel: input.channel || 'app',
      promoType: 'flash',
      flashPromo: true,
      expiresAt: input.expiresAt || new Date(Date.now() + 6 * 60 * 60_000).toISOString(),
      status: input.status || 'active',
    },
    actor,
  );
  appendAudit({ actor, action: 'promos.seed_flash_promo', detail: promo.code, meta: { id: promo.id } });
  return { ok: true, promo, overview: promosSummary() };
}
