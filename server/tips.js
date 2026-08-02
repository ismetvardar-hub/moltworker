/**
 * AŞAMA 36 — Crew bahşiş havuzu.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensurePool() {
  let pool = readCollection('tip-pool', null);
  if (!pool || typeof pool !== 'object' || Array.isArray(pool)) {
    pool = { balance: 0, currency: 'TRY', updatedAt: new Date().toISOString() };
    writeCollection('tip-pool', pool);
  }
  return pool;
}

export function listTipEntries(limit = 50) {
  return readCollection('tip-entries', []).slice(0, limit);
}

export function tipSummary() {
  const pool = ensurePool();
  const entries = listTipEntries(100);
  const today = new Date().toISOString().slice(0, 10);
  const todayIn = entries
    .filter((e) => e.kind === 'in' && e.at?.slice(0, 10) === today)
    .reduce((s, e) => s + e.amount, 0);
  const todayOut = entries
    .filter((e) => e.kind === 'out' && e.at?.slice(0, 10) === today)
    .reduce((s, e) => s + e.amount, 0);
  const flags = readCollection('tips-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA Bahşiş Havuzu',
    generatedAt: new Date().toISOString(),
    balance: pool.balance,
    currency: pool.currency || 'TRY',
    todayIn,
    todayOut,
    entries: entries.slice(0, 30),
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      balance: pool.balance,
      today_in: todayIn,
      today_out: todayOut,
      entries: entries.length,
    },
    summaryLines: [
      `Bakiye ${pool.balance} ${pool.currency || 'TRY'}`,
      `Bugün +${todayIn} / −${todayOut} · flag ${openFlags.length} açık`,
    ],
  };
}

export function addTip({ amount, note, venueId, kind = 'in', person }, actor = 'system') {
  const value = Math.abs(Number(amount) || 0);
  if (value <= 0) return null;
  const pool = ensurePool();
  const isOut = kind === 'out' || kind === 'payout';
  const nextBalance = isOut ? Math.max(0, pool.balance - value) : pool.balance + value;
  const applied = isOut ? pool.balance - nextBalance : value;
  if (isOut && applied <= 0) return null;

  const entry = {
    id: `tip_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    kind: isOut ? 'out' : 'in',
    amount: applied,
    balance: nextBalance,
    person: person || null,
    venueId: venueId || null,
    note: note || '',
    at: new Date().toISOString(),
    actor,
  };
  writeCollection('tip-pool', {
    ...pool,
    balance: nextBalance,
    updatedAt: entry.at,
  });
  prependItem('tip-entries', entry, 500);
  appendAudit({
    actor,
    action: isOut ? 'tips.payout' : 'tips.in',
    detail: `${isOut ? '-' : '+'}${applied} TRY → ${nextBalance}`,
    meta: { id: entry.id, amount: applied },
  });
  return { pool: { balance: nextBalance, currency: 'TRY' }, entry };
}

export function runTipsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = tipSummary();
  const existing = readCollection('tips-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.balance || 0) <= 0) {
    candidates.push({
      key: 'balance',
      level: (o.summary?.balance || 0) <= 0 ? 'warn' : 'info',
      text: `Bahşiş bakiyesi ${o.summary?.balance || 0}`,
      domain: 'balance',
    });
  }
  if (force || (o.summary?.today_in || 0) === 0) {
    candidates.push({
      key: 'today_in',
      level: 'info',
      text: `Bugün giriş ${o.summary?.today_in || 0}`,
      domain: 'in',
    });
  }
  if (force || (o.summary?.today_out || 0) > (o.summary?.today_in || 0)) {
    candidates.push({
      key: 'payout_pressure',
      level: (o.summary?.today_out || 0) > (o.summary?.today_in || 0) ? 'warn' : 'info',
      text: `Bugün çıkış ${o.summary?.today_out || 0} · giriş ${o.summary?.today_in || 0}`,
      domain: 'out',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Tips heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('tipf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('tips-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `tips sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('tips'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('tips-sweeps', sweep, 80);
  appendAudit({ actor, action: 'tips.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: tipSummary() };
}

export function ackTipsFlag(input = {}, actor = 'system') {
  const list = readCollection('tips-flags', []) || [];
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
  writeCollection('tips-flags', list);
  appendAudit({ actor, action: 'tips.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: tipSummary() };
}

export function addTipIn(input = {}, actor = 'system') {
  const amount = Math.abs(Number(input.amount) || 50);
  let result = addTip(
    { amount, kind: 'in', note: input.note || 'tip-in ops', person: input.person, venueId: input.venueId },
    actor,
  );
  if (!result) {
    result = addTip({ amount: 25, kind: 'in', note: 'tip-in seed' }, actor);
  }
  appendAudit({ actor, action: 'tips.in_ops', detail: `${result?.entry?.amount || 0}`, meta: { id: result?.entry?.id } });
  return { ok: true, ...result, overview: tipSummary() };
}

export function addTipOut(input = {}, actor = 'system') {
  const pool = ensurePool();
  if (pool.balance <= 0) {
    addTip({ amount: Number(input.seedIn) || 100, kind: 'in', note: 'tip-out seed-in' }, actor);
  }
  const amount = Math.abs(Number(input.amount) || 25);
  let result = addTip(
    {
      amount,
      kind: 'out',
      note: input.note || 'tip-out payout',
      person: input.person || 'Crew',
      venueId: input.venueId,
    },
    actor,
  );
  if (!result) {
    addTip({ amount: 50, kind: 'in', note: 'tip-out retry seed' }, actor);
    result = addTip({ amount: 20, kind: 'out', note: 'tip-out retry', person: 'Crew' }, actor);
  }
  appendAudit({ actor, action: 'tips.out_ops', detail: `${result?.entry?.amount || 0}`, meta: { id: result?.entry?.id } });
  return { ok: true, ...result, overview: tipSummary() };
}

export function tipBalanceSnapshot(input = {}, actor = 'system') {
  const o = tipSummary();
  const snap = {
    id: rid('tipb'),
    at: new Date().toISOString(),
    actor,
    note: String(input.note || '').slice(0, 240) || undefined,
    balance: o.balance,
    currency: o.currency,
    todayIn: o.todayIn,
    todayOut: o.todayOut,
    summary: o.summary,
  };
  prependItem('tips-snapshots', snap, 60);
  appendAudit({ actor, action: 'tips.balance_snapshot', detail: snap.id, meta: { id: snap.id } });
  return { ok: true, snapshot: snap, overview: tipSummary() };
}
