/**
 * AŞAMA 36 — Crew bahşiş havuzu.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    balance: pool.balance,
    currency: pool.currency || 'TRY',
    todayIn,
    todayOut,
    entries: entries.slice(0, 30),
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
