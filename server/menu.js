/**
 * AŞAMA 40 — Tesis menü kataloğu (fiyat + reçete bağlantısı).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

function ensureSeed() {
  let list = readCollection('menu-items', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'menu_kofte',
        name: 'Köfte Menü',
        category: 'ana',
        price: 420,
        currency: 'TRY',
        venueId: 'venue_kaleici',
        brandId: 'brand_daze',
        recipeId: 'rcp_kofte_menu',
        available: true,
        tags: ['ızgara', 'favori'],
      },
      {
        id: 'menu_ayran',
        name: 'Ayran',
        category: 'içecek',
        price: 60,
        currency: 'TRY',
        venueId: 'venue_olympos_beach',
        brandId: 'brand_daze',
        recipeId: null,
        available: true,
        tags: ['soğuk'],
      },
    ];
    writeCollection('menu-items', list);
  }
  return list;
}

export function listMenu(filter = {}) {
  let list = ensureSeed();
  if (filter.venueId) list = list.filter((m) => m.venueId === filter.venueId);
  if (filter.brandId) list = list.filter((m) => m.brandId === filter.brandId);
  if (filter.available === 'true' || filter.available === true) {
    list = list.filter((m) => m.available);
  }
  return list;
}

export function createMenuItem(input, actor = 'system') {
  const item = {
    id: `menu_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'Menü kalemi',
    category: input.category || 'genel',
    price: Math.max(0, Number(input.price) || 0),
    currency: input.currency || 'TRY',
    venueId: input.venueId || null,
    brandId: input.brandId || 'brand_daze',
    recipeId: input.recipeId || null,
    available: input.available !== false,
    tags: Array.isArray(input.tags) ? input.tags : [],
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('menu-items', item, 300);
  appendAudit({
    actor,
    action: 'menu.create',
    detail: `${item.name} · ${item.price} ${item.currency}`,
    meta: { id: item.id },
  });
  return item;
}

export function updateMenuItem(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const allowed = ['name', 'category', 'price', 'currency', 'venueId', 'brandId', 'recipeId', 'available', 'tags'];
  const next = { ...list[idx] };
  for (const k of allowed) {
    if (patch[k] !== undefined) next[k] = patch[k];
  }
  if (patch.price !== undefined) next.price = Math.max(0, Number(patch.price) || 0);
  next.updatedAt = new Date().toISOString();
  list[idx] = next;
  writeCollection('menu-items', list);
  appendAudit({
    actor,
    action: 'menu.update',
    detail: `${next.name} · ${next.available ? 'açık' : 'kapalı'}`,
    meta: { id },
  });
  return next;
}

export function removeMenuItem(id, actor = 'system') {
  const m = ensureSeed().find((x) => x.id === id);
  if (!m) return null;
  deleteItem('menu-items', id);
  appendAudit({ actor, action: 'menu.delete', detail: m.name, meta: { id } });
  return m;
}

export function menuSummary() {
  const list = listMenu();
  return {
    total: list.length,
    available: list.filter((m) => m.available).length,
    avgPrice: list.length
      ? Math.round(list.reduce((s, m) => s + m.price, 0) / list.length)
      : 0,
  };
}
