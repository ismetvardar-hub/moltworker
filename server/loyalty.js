/**
 * AŞAMA 26 — AURA sadakat / Daze-Gift puan defteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { listGuests } from './guests.js';

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
  return {
    accounts: accounts.length,
    totalPoints: accounts.reduce((s, a) => s + a.points, 0),
    top: accounts.slice(0, 5),
    ledger,
  };
}
