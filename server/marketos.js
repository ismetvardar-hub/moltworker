/**
 * Adım 6 — Pazaryeri: al · kirala · 2. el.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`; }

function ensureListings() {
  let list = readCollection('market-listings', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'ml_1', mode: 'buy', title: 'Trail kask Pro', sku: 'HELM-PRO', price_try: 4200, seller: 'Daze Hub', status: 'live' },
      { id: 'ml_2', mode: 'rent', title: 'SUP board günlüğü', sku: 'SUP-01', price_try: 900, seller: 'Park Rent', status: 'live', deposit_try: 2000 },
      { id: 'ml_3', mode: 'used', title: 'MTB ayakkabı 42', sku: 'USED-SH-42', price_try: 1800, seller: 'guest_can', status: 'live', serial: 'HK-SH-42' },
      { id: 'ml_4', mode: 'rent', title: 'Tırmanış ipi haftalık', sku: 'ROPE-W', price_try: 650, seller: 'Park Rent', status: 'hold', deposit_try: 1500 },
    ];
    writeCollection('market-listings', list);
  }
  return list;
}

export function marketOsOverview() {
  const listings = ensureListings();
  return {
    title: 'Kampüs Pazaryeri',
    tagline: 'Dene → Al · Kirala · 2. el sat',
    listings,
    summary: {
      buy: listings.filter((l) => l.mode === 'buy' && l.status === 'live').length,
      rent: listings.filter((l) => l.mode === 'rent' && l.status === 'live').length,
      used: listings.filter((l) => l.mode === 'used' && l.status === 'live').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function createMarketListing(input = {}, actor = 'system') {
  const row = {
    id: rid('ml'),
    mode: input.mode || 'used',
    title: input.title || 'İlan',
    sku: input.sku || 'SKU',
    price_try: Number(input.price_try) || 0,
    deposit_try: Number(input.deposit_try) || 0,
    seller: input.seller || actor,
    serial: input.serial || null,
    status: 'live',
    at: new Date().toISOString(),
  };
  prependItem('market-listings', row, 400);
  appendAudit({ actor, action: 'market.list', detail: `${row.mode} · ${row.title}`, meta: { id: row.id } });
  return { ok: true, listing: row, overview: marketOsOverview() };
}

export function marketCheckout(input = {}, actor = 'system') {
  const list = ensureListings();
  const idx = list.findIndex((l) => l.id === input.listing_id);
  if (idx < 0) return { ok: false, error: 'İlan yok' };
  const item = list[idx];
  if (item.status !== 'live') return { ok: false, error: 'İlan müsait değil' };
  const order = {
    id: rid('mo'),
    listing_id: item.id,
    mode: item.mode,
    title: item.title,
    price_try: item.price_try,
    buyer: input.buyer || actor,
    status: item.mode === 'rent' ? 'rented' : 'sold',
    at: new Date().toISOString(),
  };
  list[idx] = { ...item, status: item.mode === 'rent' ? 'rented' : 'sold' };
  writeCollection('market-listings', list);
  prependItem('market-orders', order, 300);
  appendAudit({ actor, action: 'market.checkout', detail: `${order.mode} · ${order.title}`, meta: { id: order.id } });
  return { ok: true, order, overview: marketOsOverview() };
}
