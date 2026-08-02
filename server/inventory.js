/**
 * AŞAMA 23 — HEPHAESTUS stok envanteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const DEFAULT_ITEMS = [
  {
    id: 'inv_kofte',
    sku: 'KF-180',
    name: 'Köfte porsiyon (180g)',
    unit: 'adet',
    qty: 120,
    minQty: 40,
    venueId: 'venue_kaleici',
    brandId: 'brand_daze',
  },
  {
    id: 'inv_ayran',
    sku: 'AY-033',
    name: 'Ayran 330ml',
    unit: 'adet',
    qty: 80,
    minQty: 24,
    venueId: 'venue_olympos_beach',
    brandId: 'brand_daze',
  },
  {
    id: 'inv_cay',
    sku: 'CY-001',
    name: 'Çay poşeti',
    unit: 'adet',
    qty: 200,
    minQty: 50,
    venueId: 'venue_olympos_beach',
    brandId: 'brand_daze',
  },
  {
    id: 'inv_rfid',
    sku: 'RF-TAG',
    name: 'RFID bileklik',
    unit: 'adet',
    qty: 35,
    minQty: 20,
    venueId: 'venue_olympos_beach',
    brandId: 'brand_olympospass',
  },
];

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensureSeed() {
  const list = readCollection('inventory', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('inventory', DEFAULT_ITEMS);
    return DEFAULT_ITEMS;
  }
  return list;
}

export function listInventory(filter = {}) {
  let items = ensureSeed();
  if (filter.venueId) items = items.filter((i) => i.venueId === filter.venueId);
  if (filter.brandId) items = items.filter((i) => i.brandId === filter.brandId);
  return items.map((i) => ({
    ...i,
    low: i.qty <= i.minQty,
  }));
}

export function adjustStock({ id, delta, reason }, actor = 'system') {
  const items = ensureSeed();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const nextQty = Math.max(0, Number(items[idx].qty) + Number(delta || 0));
  items[idx] = {
    ...items[idx],
    qty: nextQty,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('inventory', items);
  const movement = {
    id: `mov_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    at: new Date().toISOString(),
    itemId: id,
    sku: items[idx].sku,
    delta: Number(delta || 0),
    qty: nextQty,
    reason: reason || 'adjust',
    actor,
  };
  prependItem('inventory-movements', movement, 200);
  appendAudit({
    actor,
    action: 'inventory.adjust',
    detail: `${items[idx].name}: ${delta > 0 ? '+' : ''}${delta} → ${nextQty}`,
    meta: { id, delta, reason },
  });
  return { item: { ...items[idx], low: nextQty <= items[idx].minQty }, movement };
}

export function inventorySummary() {
  const items = listInventory();
  const flags = readCollection('inventory-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const lowStock = items.filter((i) => i.low).length;
  const quarantined = items.filter((i) => i.qty === 0 || i.quarantined).length;
  return {
    totalSkus: items.length,
    lowStock,
    quarantined,
    items,
    movements: readCollection('inventory-movements', []).slice(0, 20),
    title: 'LİKYA Envanter',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      low_stock: lowStock,
      quarantined,
      total_skus: items.length,
    },
    summaryLines: [
      `SKU ${items.length} · düşük ${lowStock} · karantina/sıfır ${quarantined}`,
      `Inventory flag ${openFlags.length} açık`,
    ],
  };
}

export function runInventorySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = inventorySummary();
  const existing = readCollection('inventory-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.lowStock || 0) > 0) {
    candidates.push({
      key: 'low',
      level: 'warn',
      text: `Düşük stok SKU ${o.lowStock || 0}`,
      domain: 'low',
    });
  }
  if (force || (o.quarantined || 0) > 0) {
    candidates.push({
      key: 'quarantine',
      level: 'alert',
      text: `Karantina/sıfır SKU ${o.quarantined || 0}`,
      domain: 'quarantine',
    });
  }
  if (force || (o.totalSkus || 0) > 0) {
    candidates.push({
      key: 'ops',
      level: 'info',
      text: `Toplam SKU ${o.totalSkus || 0}`,
      domain: 'ops',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Inventory heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('invf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('inventory-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `inventory sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('invs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('inventory-sweeps', sweep, 80);
  appendAudit({ actor, action: 'inventory.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: inventorySummary() };
}

export function ackInventoryFlag(input = {}, actor = 'system') {
  const list = readCollection('inventory-flags', []) || [];
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
  writeCollection('inventory-flags', list);
  appendAudit({ actor, action: 'inventory.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: inventorySummary() };
}

/** Mutator 1 — restock low SKUs. */
export function restockInventoryLows(input = {}, actor = 'system') {
  const low = listInventory().filter((i) => i.low || i.qty <= i.minQty);
  const restocked = [];
  for (const item of low.slice(0, Number(input.limit) || 20)) {
    if (input.id && item.id !== input.id) continue;
    const need = Math.max(1, Number(item.minQty || 0) - Number(item.qty || 0) + 5);
    const next = adjustStock({ id: item.id, delta: need, reason: 'inv-restock' }, actor);
    if (next) restocked.push(item.id);
  }
  if (!restocked.length) {
    const any = listInventory()[0];
    if (any) {
      const next = adjustStock({ id: any.id, delta: Number(input.qty) || 5, reason: 'inv-restock-seed' }, actor);
      if (next) restocked.push(any.id);
    }
  }
  appendAudit({ actor, action: 'inventory.restock_lows', detail: `${restocked.length}`, meta: { n: restocked.length } });
  return { ok: true, restocked, overview: inventorySummary() };
}

/** Mutator 2 — quarantine / zero bad SKU. */
export function quarantineInventorySku(input = {}, actor = 'system') {
  const items = ensureSeed();
  let target = null;
  if (input.id) target = items.find((i) => i.id === input.id);
  if (!target && input.sku) target = items.find((i) => i.sku === input.sku);
  if (!target) {
    // prefer a low or non-zero item
    target = listInventory().find((i) => i.low) || items[0];
  }
  if (!target) return { ok: false, error: 'SKU yok' };
  const idx = items.findIndex((i) => i.id === target.id);
  const prevQty = Number(items[idx].qty || 0);
  items[idx] = {
    ...items[idx],
    qty: 0,
    quarantined: true,
    quarantineReason: String(input.reason || input.note || 'quarantine').slice(0, 240),
    updatedAt: new Date().toISOString(),
  };
  writeCollection('inventory', items);
  const movement = {
    id: `mov_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    at: new Date().toISOString(),
    itemId: target.id,
    sku: items[idx].sku,
    delta: -prevQty,
    qty: 0,
    reason: 'inv-quarantine',
    actor,
  };
  prependItem('inventory-movements', movement, 200);
  appendAudit({
    actor,
    action: 'inventory.quarantine',
    detail: `${items[idx].name} → 0`,
    meta: { id: target.id, prevQty },
  });
  return {
    ok: true,
    quarantined: [target.id],
    item: { ...items[idx], low: true },
    movement,
    overview: inventorySummary(),
  };
}

/** Mutator 3 — receive delivery (adjust +). */
export function receiveInventoryDelivery(input = {}, actor = 'system') {
  const items = listInventory();
  let target = null;
  if (input.id) target = items.find((i) => i.id === input.id);
  if (!target && input.sku) target = items.find((i) => i.sku === input.sku);
  if (!target) target = items.find((i) => i.low) || items[0];
  if (!target) return { ok: false, error: 'SKU yok' };
  const qty = Math.max(1, Number(input.qty) || Number(input.delta) || 20);
  // clear quarantine on receive
  const raw = ensureSeed();
  const idx = raw.findIndex((i) => i.id === target.id);
  if (idx >= 0 && raw[idx].quarantined) {
    raw[idx] = { ...raw[idx], quarantined: false, quarantineReason: undefined };
    writeCollection('inventory', raw);
  }
  const next = adjustStock({ id: target.id, delta: qty, reason: input.reason || 'inv-delivery' }, actor);
  appendAudit({
    actor,
    action: 'inventory.receive_delivery',
    detail: `${target.name} +${qty}`,
    meta: { id: target.id, qty },
  });
  return {
    ok: true,
    received: [target.id],
    qty,
    item: next?.item,
    movement: next?.movement,
    overview: inventorySummary(),
  };
}
