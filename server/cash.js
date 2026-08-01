/**
 * AŞAMA 45 — Kasa / till hareketleri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  const todayIn = entries
    .filter((e) => e.kind === 'in' && e.at?.slice(0, 10) === today)
    .reduce((s, e) => s + e.amount, 0);
  const todayOut = entries
    .filter((e) => e.kind === 'out' && e.at?.slice(0, 10) === today)
    .reduce((s, e) => s + e.amount, 0);
  return {
    drawer,
    todayIn,
    todayOut,
    entries: entries.slice(0, 30),
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
