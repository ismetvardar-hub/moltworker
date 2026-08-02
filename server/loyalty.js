/**
 * AŞAMA 26 — AURA sadakat / Daze-Gift puan defteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { listGuests } from './guests.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensureAccounts() {
  let accounts = readCollection('loyalty-accounts', null);
  if (!Array.isArray(accounts) || accounts.length === 0) {
    const guests = listGuests().slice(0, 6);
    accounts = guests.map((g, i) => ({
      id: `loy_${g.id}`,
      guestId: g.id,
      guestName: g.name,
      phone: g.phone,
      points: 120 + i * 45,
      tier: g.tier || (i === 0 ? 'Altın' : 'Standart'),
      brandId: 'brand_daze',
      updatedAt: new Date().toISOString(),
    }));
    if (accounts.length === 0) {
      accounts = [
        {
          id: 'loy_demo',
          guestId: null,
          guestName: 'Demo Misafir',
          phone: '+905550000001',
          points: 200,
          tier: 'Gümüş',
          brandId: 'brand_daze',
          updatedAt: new Date().toISOString(),
        },
      ];
    }
    writeCollection('loyalty-accounts', accounts);
  }
  return accounts;
}

export function listLoyaltyAccounts(filter = {}) {
  let list = ensureAccounts();
  if (filter.brandId) list = list.filter((a) => a.brandId === filter.brandId);
  return list.sort((a, b) => b.points - a.points);
}

export function listLedger(limit = 40) {
  return readCollection('loyalty-ledger', []).slice(0, limit);
}

function tierFor(points) {
  if (points >= 500) return 'Platin';
  if (points >= 300) return 'Altın';
  if (points >= 150) return 'Gümüş';
  return 'Standart';
}

export function adjustPoints({ accountId, guestName, phone, delta, reason, note }, actor = 'system') {
  const accounts = ensureAccounts();
  let idx = accounts.findIndex((a) => a.id === accountId);
  if (idx < 0 && (guestName || phone)) {
    const acc = {
      id: `loy_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
      guestId: null,
      guestName: guestName || phone || 'Misafir',
      phone: phone || null,
      points: 0,
      tier: 'Standart',
      brandId: 'brand_daze',
      updatedAt: new Date().toISOString(),
    };
    accounts.unshift(acc);
    idx = 0;
  }
  if (idx < 0) return null;

  const d = Number(delta) || 0;
  const nextPoints = Math.max(0, accounts[idx].points + d);
  accounts[idx] = {
    ...accounts[idx],
    points: nextPoints,
    tier: tierFor(nextPoints),
    updatedAt: new Date().toISOString(),
  };
  writeCollection('loyalty-accounts', accounts);

  const entry = {
    id: `led_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    at: new Date().toISOString(),
    accountId: accounts[idx].id,
    guestName: accounts[idx].guestName,
    delta: d,
    points: nextPoints,
    reason: reason || (d >= 0 ? 'earn' : 'redeem'),
    note: note || '',
    actor,
  };
  prependItem('loyalty-ledger', entry, 400);
  appendAudit({
    actor,
    action: 'loyalty.adjust',
    detail: `${accounts[idx].guestName}: ${d >= 0 ? '+' : ''}${d} → ${nextPoints}`,
    meta: { accountId: accounts[idx].id, delta: d, reason: entry.reason },
  });
  return { account: accounts[idx], entry };
}

export function loyaltySummary() {
  const accounts = listLoyaltyAccounts();
  const ledger = listLedger(20);
  const low = accounts.filter((a) => a.points < 50).length;
  const flags = readCollection('loyalty-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const totalPoints = accounts.reduce((s, a) => s + a.points, 0);
  return {
    title: 'LİKYA Sadakat / Daze-Gift',
    generatedAt: new Date().toISOString(),
    accounts: accounts.length,
    totalPoints,
    top: accounts.slice(0, 5),
    ledger,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      accounts: accounts.length,
      total_points: totalPoints,
      low_balance: low,
      ledger: ledger.length,
    },
    summaryLines: [
      `${accounts.length} hesap · ${totalPoints} puan`,
      `Düşük bakiye ${low} · defter ${ledger.length} · flag ${openFlags.length}`,
    ],
  };
}

export function runLoyaltySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = loyaltySummary();
  const existing = readCollection('loyalty-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.low_balance || 0) > 0) {
    candidates.push({
      key: 'low_balance',
      level: 'warn',
      text: `Düşük puanlı hesap ${o.summary?.low_balance || 0}`,
      domain: 'balance',
    });
  }
  if (force || (o.summary?.accounts || 0) < 2) {
    candidates.push({
      key: 'volume',
      level: 'info',
      text: `Sadakat hesabı ${o.summary?.accounts || 0}`,
      domain: 'volume',
    });
  }
  if (force || (o.summary?.ledger || 0) === 0) {
    candidates.push({
      key: 'ledger',
      level: 'info',
      text: `Defter hareketi ${o.summary?.ledger || 0}`,
      domain: 'ledger',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Loyalty heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('loyf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('loyalty-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `loyalty sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('loys'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('loyalty-sweeps', sweep, 80);
  appendAudit({ actor, action: 'loyalty.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: loyaltySummary() };
}

export function ackLoyaltyFlag(input = {}, actor = 'system') {
  const list = readCollection('loyalty-flags', []) || [];
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
  writeCollection('loyalty-flags', list);
  appendAudit({ actor, action: 'loyalty.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: loyaltySummary() };
}

export function awardLoyaltyPoints(input = {}, actor = 'system') {
  const accounts = listLoyaltyAccounts();
  const accountId = input.accountId || accounts[0]?.id;
  let result = adjustPoints(
    {
      accountId,
      guestName: input.guestName || (!accountId ? 'Award Seed' : undefined),
      phone: input.phone,
      delta: Math.abs(Number(input.delta) || 25),
      reason: input.reason || 'earn',
      note: input.note || 'loyalty award',
    },
    actor,
  );
  if (!result) {
    result = adjustPoints(
      { guestName: 'Award Seed', delta: 25, reason: 'earn', note: 'award seed' },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'loyalty.award',
    detail: `${result?.entry?.delta || 0}`,
    meta: { accountId: result?.account?.id },
  });
  return { ok: true, ...result, overview: loyaltySummary() };
}

export function redeemLoyaltyPoints(input = {}, actor = 'system') {
  const accounts = listLoyaltyAccounts();
  let account = accounts.find((a) => a.id === input.accountId) || accounts.find((a) => a.points > 0) || accounts[0];
  if (!account || account.points <= 0) {
    adjustPoints(
      { accountId: account?.id, guestName: account?.guestName || 'Redeem Seed', delta: 50, reason: 'earn', note: 'redeem seed-in' },
      actor,
    );
    account = listLoyaltyAccounts().find((a) => a.id === (account?.id || input.accountId)) || listLoyaltyAccounts()[0];
  }
  const delta = -Math.abs(Number(input.delta) || Math.min(20, account?.points || 20));
  let result = adjustPoints(
    {
      accountId: account?.id,
      guestName: input.guestName || account?.guestName,
      delta,
      reason: input.reason || 'redeem',
      note: input.note || 'loyalty redeem',
    },
    actor,
  );
  if (!result) {
    result = adjustPoints(
      { guestName: 'Redeem Seed', delta: -10, reason: 'redeem', note: 'redeem seed' },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'loyalty.redeem',
    detail: `${result?.entry?.delta || 0}`,
    meta: { accountId: result?.account?.id },
  });
  return { ok: true, ...result, overview: loyaltySummary() };
}
