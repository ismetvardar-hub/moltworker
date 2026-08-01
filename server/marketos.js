/**
 * Adım 6+ — Pazaryeri: al · kirala · 2. el + Trendyol/Dolap kanal köprüsü.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { createTybridge, tybridgeSummary } from './tybridge.js';
import { createDolaplist, dolaplistSummary } from './dolaplist.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureListings() {
  let list = readCollection('market-listings', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'ml_1', mode: 'buy', title: 'Trail kask Pro', sku: 'HELM-PRO', price_try: 4200, seller: 'Daze Hub', status: 'live', stock: 2, reorder_at: 3, channels: [] },
      { id: 'ml_2', mode: 'rent', title: 'SUP board günlüğü', sku: 'SUP-01', price_try: 900, seller: 'Park Rent', status: 'live', deposit_try: 2000, stock: 5, reorder_at: 2, channels: [] },
      { id: 'ml_3', mode: 'used', title: 'MTB ayakkabı 42', sku: 'USED-SH-42', price_try: 1800, seller: 'guest_can', status: 'live', serial: 'HK-SH-42', stock: 1, reorder_at: 1, channels: [] },
      { id: 'ml_4', mode: 'rent', title: 'Tırmanış ipi haftalık', sku: 'ROPE-W', price_try: 650, seller: 'Park Rent', status: 'hold', deposit_try: 1500, stock: 0, reorder_at: 2, channels: [] },
    ];
    writeCollection('market-listings', list);
  }
  return list;
}

export function marketOsOverview() {
  const listings = ensureListings();
  const ty = tybridgeSummary();
  const dolap = dolaplistSummary();
  const pos = readCollection('market-purchase-orders', []) || [];
  const poList = Array.isArray(pos) ? pos : [];
  const openPo = poList.filter((p) => p.status === 'open' || p.status === 'ordered');
  const low = listings.filter(
    (l) => (Number(l.stock) || 0) <= (Number(l.reorder_at) || 0) || l.status === 'hold',
  );
  return {
    title: 'Kampüs Pazaryeri',
    tagline: 'Dene → Al · Kirala · 2. el sat · kanala it',
    listings,
    purchase_orders: poList.slice(0, 30),
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
      low_stock: low.length,
      open_pos: openPo.length,
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

/** Kiralama iadesi — listing tekrar live */
export function returnMarketRental(input = {}, actor = 'system') {
  const list = ensureListings();
  const orders = readCollection('market-orders', []) || [];
  const olist = Array.isArray(orders) ? orders : [];
  let order = olist.find((o) => o.id === input.order_id);
  if (!order) order = olist.find((o) => o.listing_id === input.listing_id && o.status === 'rented');
  if (!order || order.mode !== 'rent') {
    // listing üzerinden
    const idx = list.findIndex((l) => l.id === input.listing_id && l.status === 'rented');
    if (idx < 0) return { ok: false, error: 'Aktif kiralama yok' };
    list[idx] = { ...list[idx], status: 'live' };
    writeCollection('market-listings', list);
    const ret = { id: rid('mr'), listing_id: list[idx].id, at: new Date().toISOString(), actor };
    prependItem('market-returns', ret, 200);
    appendAudit({ actor, action: 'market.return', detail: list[idx].title, meta: { id: ret.id } });
    return { ok: true, listing: list[idx], overview: marketOsOverview() };
  }
  const lidx = list.findIndex((l) => l.id === order.listing_id);
  if (lidx >= 0) {
    list[lidx] = { ...list[lidx], status: 'live' };
    writeCollection('market-listings', list);
  }
  const oidx = olist.findIndex((o) => o.id === order.id);
  if (oidx >= 0) {
    olist[oidx] = { ...olist[oidx], status: 'returned', returned_at: new Date().toISOString() };
    writeCollection('market-orders', olist);
  }
  const ret = { id: rid('mr'), order_id: order.id, listing_id: order.listing_id, at: new Date().toISOString(), actor };
  prependItem('market-returns', ret, 200);
  appendAudit({ actor, action: 'market.return', detail: order.title, meta: { id: ret.id } });
  return { ok: true, order: olist[oidx] || order, overview: marketOsOverview() };
}

/** Satılan / hold listing’i yeniden live + stok */
export function restockMarketListing(input = {}, actor = 'system') {
  const list = ensureListings();
  const idx = list.findIndex((l) => l.id === input.listing_id || l.sku === input.listing_id);
  if (idx < 0) return { ok: false, error: 'Listing yok' };
  list[idx] = {
    ...list[idx],
    status: 'live',
    stock: Number(input.stock) || Math.max(1, Number(list[idx].stock) || 1),
    restocked_at: new Date().toISOString(),
  };
  writeCollection('market-listings', list);
  appendAudit({
    actor,
    action: 'market.restock',
    detail: `${list[idx].title} · stok ${list[idx].stock}`,
    meta: { id: list[idx].id },
  });
  return { ok: true, listing: list[idx], overview: marketOsOverview() };
}

/** Live listing’leri kanal köprülerine toplu sync */
export function reconcileMarketChannels(input = {}, actor = 'system') {
  const list = ensureListings().filter((l) => l.status === 'live');
  const channel = (input.channel || 'both').toLowerCase();
  const synced = [];
  for (const item of list.slice(0, Number(input.limit) || 20)) {
    if (channel === 'both' || channel === 'tybridge' || channel === 'trendyol') {
      const r = syncMarketChannel({ listing_id: item.id, channel: 'tybridge' }, actor);
      if (r.ok) synced.push({ listing_id: item.id, channel: 'trendyol', bridge_id: r.bridge?.id });
    }
    if (channel === 'both' || channel.startsWith('dolap')) {
      const r = syncMarketChannel({ listing_id: item.id, channel: 'dolap' }, actor);
      if (r.ok) synced.push({ listing_id: item.id, channel: 'dolap', bridge_id: r.bridge?.id });
    }
  }
  const run = {
    id: rid('mcr'),
    n: synced.length,
    channel,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('market-reconciles', run, 80);
  appendAudit({
    actor,
    action: 'market.reconcile',
    detail: `${synced.length} sync · ${channel}`,
    meta: { id: run.id },
  });
  return { ok: true, run, synced, overview: marketOsOverview() };
}

/** Düşük stok taraması → PO + MINT/HERMES */
export function runMarketLowStockSweep(input = {}, actor = 'system') {
  const list = ensureListings();
  const flagged = [];
  for (const item of list) {
    const stock = Number(item.stock);
    const reorder = Number(item.reorder_at);
    const low =
      (Number.isFinite(stock) && Number.isFinite(reorder) && stock <= reorder) ||
      item.status === 'hold' ||
      stock === 0;
    if (!low && !input.force_all) continue;
    flagged.push(item);
  }
  const created = [];
  for (const item of flagged.slice(0, Number(input.limit) || 20)) {
    const qty = Number(input.qty) || Math.max(2, (Number(item.reorder_at) || 1) * 2 - (Number(item.stock) || 0));
    const po = createMarketPurchaseOrder(
      {
        listing_id: item.id,
        qty,
        auto: true,
      },
      actor,
    );
    if (po.ok) created.push(po.po);
  }
  const sweep = {
    id: rid('mls'),
    flagged: flagged.length,
    pos: created.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('market-low-stock-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'market.low_stock',
    detail: `${flagged.length} SKU · ${created.length} PO`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, flagged, created, overview: marketOsOverview() };
}

export function createMarketPurchaseOrder(input = {}, actor = 'system') {
  const list = ensureListings();
  const item =
    list.find((l) => l.id === input.listing_id || l.sku === input.listing_id) ||
    list.find((l) => (Number(l.stock) || 0) <= (Number(l.reorder_at) || 0)) ||
    list[0];
  if (!item) return { ok: false, error: 'Listing yok' };
  const qty = Math.max(1, Number(input.qty) || 4);
  const po = {
    id: rid('mpo'),
    listing_id: item.id,
    sku: item.sku,
    title: item.title,
    qty,
    unit_cost_try: Number(input.unit_cost_try) || Math.round((Number(item.price_try) || 0) * 0.55),
    status: 'open',
    vendor: input.vendor || item.seller || 'Kampüs Tedarik',
    auto: !!input.auto,
    at: new Date().toISOString(),
    actor,
  };
  po.total_try = po.qty * po.unit_cost_try;
  prependItem('market-purchase-orders', po, 300);
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `market PO · ${po.sku} ×${po.qty} · ${po.total_try} TRY`,
      priority: (Number(item.stock) || 0) === 0 ? 'high' : 'normal',
      payload: { po_id: po.id, listing_id: item.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'market.po',
    detail: `${po.sku} ×${po.qty}`,
    meta: { id: po.id },
  });
  return { ok: true, po, overview: marketOsOverview() };
}

/** PO teslim → stok artır + listing live */
export function receiveMarketPurchaseOrder(input = {}, actor = 'system') {
  const pos = readCollection('market-purchase-orders', []) || [];
  if (!Array.isArray(pos) || !pos.length) return { ok: false, error: 'PO yok' };
  let idx = pos.findIndex((p) => p.id === input.po_id && (p.status === 'open' || p.status === 'ordered'));
  if (idx < 0) idx = pos.findIndex((p) => p.status === 'open' || p.status === 'ordered');
  if (idx < 0) return { ok: false, error: 'Açık PO yok' };
  const po = pos[idx];
  const qty = Number(input.qty) || Number(po.qty) || 1;
  pos[idx] = {
    ...po,
    status: 'received',
    received_qty: qty,
    received_at: new Date().toISOString(),
    received_by: actor,
  };
  writeCollection('market-purchase-orders', pos);
  const list = ensureListings();
  const lidx = list.findIndex((l) => l.id === po.listing_id);
  if (lidx >= 0) {
    list[lidx] = {
      ...list[lidx],
      stock: (Number(list[lidx].stock) || 0) + qty,
      status: 'live',
      restocked_at: new Date().toISOString(),
    };
    writeCollection('market-listings', list);
  }
  appendAudit({
    actor,
    action: 'market.po_receive',
    detail: `${po.sku} +${qty}`,
    meta: { id: po.id },
  });
  return { ok: true, po: pos[idx], listing: lidx >= 0 ? list[lidx] : null, overview: marketOsOverview() };
}
