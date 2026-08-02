/**
 * AŞAMA 45 — Kasa / till hareketleri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureDrawer(venueId = 'venue_olympos_beach') {
  const all = readCollection('cash-drawers', null);
  const map = all && typeof all === 'object' && !Array.isArray(all) ? all : {};
  if (!map[venueId]) {
    map[venueId] = {
      venueId,
      balance: 2000,
      currency: 'TRY',
      updatedAt: new Date().toISOString(),
    };
    writeCollection('cash-drawers', map);
  }
  return map[venueId];
}

function writeDrawer(drawer) {
  const all = readCollection('cash-drawers', {});
  const map = all && typeof all === 'object' && !Array.isArray(all) ? { ...all } : {};
  map[drawer.venueId] = drawer;
  writeCollection('cash-drawers', map);
}

export function listCashEntries(limit = 50) {
  return readCollection('cash-entries', []).slice(0, limit);
}

export function cashSummary(venueId = 'venue_olympos_beach') {
  const drawer = ensureDrawer(venueId);
  const entries = listCashEntries(40).filter((e) => !venueId || e.venueId === venueId);
  const today = new Date().toISOString().slice(0, 10);
  const flags = readCollection('cash-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const closes = readCollection('cash-daily-closes', []) || [];
  const closeList = Array.isArray(closes) ? closes : [];
  const todayClose = closeList.find((c) => c.venueId === venueId && c.date === today);
  const imbalancedCloses = closeList.filter((c) => c.venueId === venueId && Math.abs(Number(c.varianceTry) || 0) >= 50);
  const largeDrops = entries.filter((e) => e.kind === 'out' && Number(e.amount) >= 1000);
  const todayIn = entries
    .filter((e) => e.kind === 'in' && e.at?.slice(0, 10) === today)
    .reduce((s, e) => s + e.amount, 0);
  const todayOut = entries
    .filter((e) => e.kind === 'out' && e.at?.slice(0, 10) === today)
    .reduce((s, e) => s + e.amount, 0);
  return {
    title: 'LİKYA Kasa Ops',
    drawer,
    todayIn,
    todayOut,
    entries: entries.slice(0, 30),
    flags: openFlags.slice(0, 30),
    dailyCloses: closeList.filter((c) => !venueId || c.venueId === venueId).slice(0, 20),
    imbalances: imbalancedCloses.length,
    largeDrops: largeDrops.length,
    missingDailyClose: todayClose ? 0 : 1,
    summary: {
      flags_open: openFlags.length,
      balance_try: drawer.balance,
      today_in_try: todayIn,
      today_out_try: todayOut,
      imbalances: imbalancedCloses.length,
      large_drops: largeDrops.length,
      missing_daily_close: todayClose ? 0 : 1,
      entries: entries.length,
    },
    summaryLines: [
      `Kasa ${drawer.balance} TRY · bugün giriş ${todayIn} · çıkış ${todayOut}`,
      `İmbalance ${imbalancedCloses.length} · büyük drop ${largeDrops.length} · flag ${openFlags.length}`,
    ],
  };
}

export function postCash({ venueId, amount, kind = 'in', note, reason }, actor = 'system') {
  const vid = venueId || 'venue_olympos_beach';
  const drawer = ensureDrawer(vid);
  const value = Math.abs(Number(amount) || 0);
  if (value <= 0) return null;
  const isOut = kind === 'out' || kind === 'drop';
  const nextBalance = isOut ? Math.max(0, drawer.balance - value) : drawer.balance + value;
  const applied = isOut ? drawer.balance - nextBalance : value;
  if (isOut && applied <= 0) return null;

  const entry = {
    id: `cash_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    venueId: vid,
    kind: isOut ? 'out' : 'in',
    amount: applied,
    balance: nextBalance,
    reason: reason || (isOut ? 'drop' : 'sale'),
    note: note || '',
    at: new Date().toISOString(),
    actor,
  };
  writeDrawer({
    ...drawer,
    balance: nextBalance,
    updatedAt: entry.at,
  });
  prependItem('cash-entries', entry, 500);
  appendAudit({
    actor,
    action: isOut ? 'cash.out' : 'cash.in',
    detail: `${vid}: ${isOut ? '-' : '+'}${applied} → ${nextBalance}`,
    meta: { id: entry.id, amount: applied },
  });
  return { drawer: ensureDrawer(vid), entry };
}

function addCashFlag(candidate, actor = 'system') {
  const existing = readCollection('cash-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('cashf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('cash-flags', list.slice(0, 200));
  return flag;
}

export function runCashSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const venueId = input.venueId || 'venue_olympos_beach';
  const overview = cashSummary(venueId);
  const created = [];
  const candidates = [];
  if (force || (overview.imbalances || 0) > 0) {
    candidates.push({
      key: `cash_imbalance_${venueId}`,
      level: (overview.imbalances || 0) > 0 ? 'alert' : 'info',
      text: `Kasa günlük close imbalance ${overview.imbalances || 0}`,
      domain: 'close',
      venueId,
    });
  }
  if (force || (overview.missingDailyClose || 0) > 0) {
    candidates.push({
      key: `cash_missing_close_${venueId}`,
      level: (overview.missingDailyClose || 0) > 0 ? 'warn' : 'info',
      text: `Bugün için kasa close kaydı ${overview.missingDailyClose ? 'eksik' : 'tamam'}`,
      domain: 'daily-close',
      venueId,
    });
  }
  if (force || (overview.largeDrops || 0) > 0) {
    candidates.push({
      key: `cash_large_drop_${venueId}`,
      level: (overview.largeDrops || 0) > 0 ? 'warn' : 'info',
      text: `Büyük cash-out/drop adedi ${overview.largeDrops || 0}`,
      domain: 'drop',
      venueId,
    });
  }
  for (const c of candidates) {
    const flag = addCashFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `cash sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id), venueId },
      },
      actor,
    );
  }
  const sweep = { id: rid('cashs'), created: created.length, venueId, at: new Date().toISOString(), actor };
  prependItem('cash-sweeps', sweep, 80);
  appendAudit({ actor, action: 'cash.sweep', detail: `${created.length} flag`, meta: { id: sweep.id, venueId } });
  return { ok: true, sweep, created, overview: cashSummary(venueId) };
}

export function ackCashFlag(input = {}, actor = 'system') {
  const list = readCollection('cash-flags', []) || [];
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
  writeCollection('cash-flags', list);
  appendAudit({ actor, action: 'cash.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: cashSummary(list[idx].venueId || input.venueId) };
}

/** Mutator 1 — post a till entry through the existing cash helper. */
export function postCashEntry(input = {}, actor = 'system') {
  const result = postCash(
    {
      venueId: input.venueId || 'venue_olympos_beach',
      amount: Number(input.amount) || 250,
      kind: input.kind || 'in',
      reason: input.reason || 'ops-entry',
      note: input.note || 'ops cash entry',
    },
    actor,
  );
  if (!result) return { ok: false, error: 'Geçersiz tutar veya yetersiz bakiye' };
  return { ok: true, ...result, overview: cashSummary(result.drawer.venueId) };
}

/** Mutator 2 — add an explicit imbalance flag for close reconciliation drills. */
export function flagCashImbalance(input = {}, actor = 'system') {
  const venueId = input.venueId || 'venue_olympos_beach';
  const flag =
    addCashFlag(
      {
        key: `cash_manual_imbalance_${venueId}`,
        level: 'alert',
        text: input.text || `Kasa sayım farkı ${Number(input.varianceTry) || 125} TRY`,
        domain: 'imbalance',
        venueId,
        varianceTry: Number(input.varianceTry) || 125,
      },
      actor,
    ) || readCollection('cash-flags', []).find((f) => f.key === `cash_manual_imbalance_${venueId}` && f.status === 'open');
  appendAudit({ actor, action: 'cash.flag_imbalance', detail: flag?.text || venueId, meta: { id: flag?.id, venueId } });
  return { ok: true, flag, overview: cashSummary(venueId) };
}

/** Mutator 3 — seed a daily close row with an optional variance. */
export function seedCashDailyClose(input = {}, actor = 'system') {
  const venueId = input.venueId || 'venue_olympos_beach';
  const drawer = ensureDrawer(venueId);
  const expectedTry = Number(input.expectedTry ?? drawer.balance);
  const actualTry = Number(input.actualTry ?? expectedTry - (Number(input.varianceTry) || 125));
  const close = {
    id: rid('cashdc'),
    venueId,
    date: input.date || new Date().toISOString().slice(0, 10),
    expectedTry,
    actualTry,
    varianceTry: actualTry - expectedTry,
    status: Math.abs(actualTry - expectedTry) >= 50 ? 'flagged' : 'closed',
    note: input.note || 'ops daily close seed',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('cash-daily-closes', close, 120);
  appendAudit({ actor, action: 'cash.seed_daily_close', detail: `${venueId}: ${close.varianceTry}`, meta: { id: close.id } });
  return { ok: true, close, overview: cashSummary(venueId) };
}
