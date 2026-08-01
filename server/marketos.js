/**
 * Adım 6+ — Pazaryeri: al · kirala · 2. el + Trendyol/Dolap kanal köprüsü.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { createTybridge, tybridgeSummary } from './tybridge.js';
import { createDolaplist, dolaplistSummary } from './dolaplist.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureListings() {
  let list = readCollection('market-listings', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'ml_1', mode: 'buy', title: 'Trail kask Pro', sku: 'HELM-PRO', price_try: 4200, seller: 'Daze Hub', status: 'live', channels: [] },
      { id: 'ml_2', mode: 'rent', title: 'SUP board günlüğü', sku: 'SUP-01', price_try: 900, seller: 'Park Rent', status: 'live', deposit_try: 2000, channels: [] },
      { id: 'ml_3', mode: 'used', title: 'MTB ayakkabı 42', sku: 'USED-SH-42', price_try: 1800, seller: 'guest_can', status: 'live', serial: 'HK-SH-42', channels: [] },
      { id: 'ml_4', mode: 'rent', title: 'Tırmanış ipi haftalık', sku: 'ROPE-W', price_try: 650, seller: 'Park Rent', status: 'hold', deposit_try: 1500, channels: [] },
    ];
    writeCollection('market-listings', list);
  }
  return list;
}

export function marketOsOverview() {
  const listings = ensureListings();
  const ty = tybridgeSummary();
  const dolap = dolaplistSummary();
  return {
    title: 'Kampüs Pazaryeri',
    tagline: 'Dene → Al · Kirala · 2. el sat · kanala it',
    listings,
    channels: {
      trendyol: { queued: ty.queued, pushed: ty.pushed, synced: ty.synced, error: ty.error, total: ty.total },
      dolap: {
        total: dolap.total,
        draft: dolap.draft,
        listed: dolap.listed,
        sold: dolap.sold,
      },
    },
    summary: {
      buy: listings.filter((l) => l.mode === 'buy' && l.status === 'live').length,
      rent: listings.filter((l) => l.mode === 'rent' && l.status === 'live').length,
      used: listings.filter((l) => l.mode === 'used' && l.status === 'live').length,
      channelled: listings.filter((l) => (l.channels || []).length).length,
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
    channels: [],
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

/** İlanı Trendyol veya Dolap kuyruğuna it */
export function syncMarketChannel(input = {}, actor = 'system') {
  const list = ensureListings();
  const idx = list.findIndex((l) => l.id === input.listing_id);
  if (idx < 0) return { ok: false, error: 'İlan yok' };
  const item = list[idx];
  const channel = (input.channel || 'tybridge').toLowerCase();
  let bridge = null;
  if (channel === 'dolap' || channel === 'dolaplist') {
    bridge = createDolaplist(
      { sku: item.sku, status: 'listed', price: item.price_try, title: item.title },
      actor,
    );
  } else {
    bridge = createTybridge({ sku: item.sku, qty: Number(input.qty) || 1, status: 'queued' }, actor);
  }
  const ch = channel.startsWith('dolap') ? 'dolap' : 'trendyol';
  const channels = Array.from(new Set([...(item.channels || []), ch]));
  list[idx] = { ...item, channels, last_bridge_id: bridge.id };
  writeCollection('market-listings', list);
  prependItem(
    'market-channel-syncs',
    { id: rid('mcs'), listing_id: item.id, channel: ch, bridge_id: bridge.id, at: new Date().toISOString() },
    200,
  );
  appendAudit({
    actor,
    action: 'market.channel',
    detail: `${item.sku} → ${ch}`,
    meta: { listing_id: item.id, bridge_id: bridge.id },
  });
  return { ok: true, bridge, listing: list[idx], overview: marketOsOverview() };
}
