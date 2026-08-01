/**
 * AŞAMA 23 — HEPHAESTUS stok envanteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    totalSkus: items.length,
    lowStock: items.filter((i) => i.low).length,
    items,
    movements: readCollection('inventory-movements', []).slice(0, 20),
  };
}
