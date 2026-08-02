/**
 * AŞAMA 35 — Kayıp eşya defteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function hoursOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 3600_000;
}

function ensureSeed() {
  let list = readCollection('lost-found', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'lf_1',
        item: 'Siyah güneş gözlüğü',
        venueId: 'venue_olympos_beach',
        location: 'Sahil şezlong 14',
        status: 'stored',
        foundBy: 'Selin M.',
        claimant: null,
        note: 'Marka Ray-Ban benzeri',
        at: new Date(Date.now() - 7200_000).toISOString(),
      },
    ];
    writeCollection('lost-found', list);
  }
  return list;
}

export function listLostFound(filter = {}) {
  let list = ensureSeed();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  if (filter.venueId) list = list.filter((x) => x.venueId === filter.venueId);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createLostFound(input, actor = 'system') {
  const entry = {
    id: `lf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: String(input.item || '').trim() || 'Eşya',
    venueId: input.venueId || 'venue_olympos_beach',
    location: input.location || '',
    status: 'stored',
    foundBy: input.foundBy || actor,
    claimant: null,
    note: input.note || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lost-found', entry, 300);
  appendAudit({
    actor,
    action: 'lostfound.create',
    detail: entry.item,
    meta: { id: entry.id },
  });
  return entry;
}

export function updateLostFound(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const allowed = ['item', 'venueId', 'location', 'status', 'claimant', 'note', 'foundBy'];
  const next = { ...list[idx] };
  for (const k of allowed) {
    if (patch[k] !== undefined) next[k] = patch[k];
  }
  next.updatedAt = new Date().toISOString();
  list[idx] = next;
  writeCollection('lost-found', list);
  appendAudit({
    actor,
    action: 'lostfound.update',
    detail: `${next.item} → ${next.status}`,
    meta: { id },
  });
  return next;
}

export function lostFoundSummary() {
  const list = listLostFound();
  const flags = readCollection('lostfound-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const storedTooLong = list.filter((x) => x.status === 'stored' && hoursOld(x.at || x.createdAt) >= 72);
  const missingLocation = list.filter((x) => x.status === 'stored' && !String(x.location || '').trim());
  const returnedWithoutClaimant = list.filter((x) => x.status === 'returned' && !String(x.claimant || '').trim());
  return {
    title: 'LİKYA Kayıp Eşya Ops',
    total: list.length,
    stored: list.filter((x) => x.status === 'stored').length,
    returned: list.filter((x) => x.status === 'returned').length,
    storedTooLong: storedTooLong.length,
    missingLocation: missingLocation.length,
    returnedWithoutClaimant: returnedWithoutClaimant.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      stored: list.filter((x) => x.status === 'stored').length,
      returned: list.filter((x) => x.status === 'returned').length,
      stored_too_long: storedTooLong.length,
      missing_location: missingLocation.length,
      returned_without_claimant: returnedWithoutClaimant.length,
    },
    summaryLines: [
      `Kayıp eşya ${list.length} · depoda ${list.filter((x) => x.status === 'stored').length} · iade ${list.filter((x) => x.status === 'returned').length}`,
      `Uzun depoda ${storedTooLong.length} · konumsuz ${missingLocation.length} · claimantsiz iade ${returnedWithoutClaimant.length}`,
    ],
  };
}

export function runLostfoundSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = lostFoundSummary();
  const existing = readCollection('lostfound-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.storedTooLong || 0) > 0) {
    candidates.push({
      key: 'lostfound_stored_too_long',
      level: (overview.storedTooLong || 0) > 0 ? 'warn' : 'info',
      text: `Uzun süredir depoda bekleyen eşya ${overview.storedTooLong || 0}`,
      domain: 'retention',
    });
  }
  if (force || (overview.missingLocation || 0) > 0) {
    candidates.push({
      key: 'lostfound_missing_location',
      level: (overview.missingLocation || 0) > 0 ? 'alert' : 'info',
      text: `Lokasyon bilgisi eksik eşya ${overview.missingLocation || 0}`,
      domain: 'location',
    });
  }
  if (force || (overview.returnedWithoutClaimant || 0) > 0) {
    candidates.push({
      key: 'lostfound_returned_without_claimant',
      level: (overview.returnedWithoutClaimant || 0) > 0 ? 'warn' : 'info',
      text: `Claimant kaydı olmadan iade ${overview.returnedWithoutClaimant || 0}`,
      domain: 'claimant',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('lff'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('lostfound-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `lostfound sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('lfs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('lostfound-sweeps', sweep, 80);
  appendAudit({ actor, action: 'lostfound.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: lostFoundSummary() };
}

export function ackLostfoundFlag(input = {}, actor = 'system') {
  const list = readCollection('lostfound-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('lostfound-flags', list);
  appendAudit({ actor, action: 'lostfound.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: lostFoundSummary() };
}

/** Mutator 1 — return a stored item with claimant evidence. */
export function returnLostFoundItem(input = {}, actor = 'system') {
  let target = null;
  if (input.id || input.itemId) target = ensureSeed().find((x) => x.id === (input.id || input.itemId));
  if (!target) target = listLostFound().find((x) => x.status === 'stored') || listLostFound()[0];
  if (!target && input.seed !== false) target = seedAgingLostFoundItem({}, actor).item;
  if (!target) return { ok: false, error: 'Kayıt bulunamadı' };
  const item = updateLostFound(
    target.id,
    {
      status: 'returned',
      claimant: input.claimant || input.claimantName || 'Ops claimant',
      note: input.note || target.note || 'ops return',
    },
    actor,
  );
  appendAudit({ actor, action: 'lostfound.return_ops', detail: item?.item || target.item, meta: { id: target.id } });
  return { ok: true, item, returned: item ? [item.id] : [], overview: lostFoundSummary() };
}

/** Mutator 2 — move an item to a known storage location. */
export function relocateLostFoundItem(input = {}, actor = 'system') {
  let target = null;
  if (input.id || input.itemId) target = ensureSeed().find((x) => x.id === (input.id || input.itemId));
  if (!target) target = listLostFound().find((x) => !String(x.location || '').trim()) || listLostFound().find((x) => x.status === 'stored');
  if (!target && input.seed !== false) target = seedAgingLostFoundItem({ missingLocation: true }, actor).item;
  if (!target) return { ok: false, error: 'Kayıt bulunamadı' };
  const item = updateLostFound(
    target.id,
    {
      location: input.location || 'Lost&Found raf A1',
      status: input.status || target.status || 'stored',
      note: input.note || target.note || 'ops relocate',
    },
    actor,
  );
  appendAudit({ actor, action: 'lostfound.relocate', detail: item?.location || target.id, meta: { id: target.id } });
  return { ok: true, item, relocated: item ? [item.id] : [], overview: lostFoundSummary() };
}

/** Mutator 3 — seed an aging stored item for retention drills. */
export function seedAgingLostFoundItem(input = {}, actor = 'system') {
  const item = createLostFound(
    {
      item: input.item || 'Aging lostfound seed',
      venueId: input.venueId || 'venue_olympos_beach',
      location: input.missingLocation ? '' : input.location || 'Emanet dolabı',
      note: input.note || 'retention drill seed',
      foundBy: input.foundBy || actor,
    },
    actor,
  );
  const list = ensureSeed();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      at: new Date(Date.now() - (Number(input.hours) || 96) * 3600_000).toISOString(),
    };
    writeCollection('lost-found', list);
  }
  appendAudit({ actor, action: 'lostfound.seed_aging', detail: item.item, meta: { id: item.id } });
  return { ok: true, item: ensureSeed().find((x) => x.id === item.id) || item, overview: lostFoundSummary() };
}
