/**
 * AŞAMA 40 — Tesis menü kataloğu (fiyat + reçete bağlantısı).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { listRecipes } from './recipes.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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
  const allowed = [
    'name',
    'category',
    'price',
    'currency',
    'venueId',
    'brandId',
    'recipeId',
    'available',
    'tags',
    'featured',
    'featuredAt',
    'unavailableReason',
  ];
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
  const recipes = new Set(listRecipes().map((r) => r.id));
  const flags = readCollection('menu-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const unavailable = list.filter((m) => !m.available);
  const orphanRecipe = list.filter((m) => m.recipeId && !recipes.has(m.recipeId));
  const inactiveFeatured = list.filter((m) => m.featured && !m.available);
  const featured = list.filter((m) => m.featured);
  return {
    title: 'LİKYA Menü Ops',
    total: list.length,
    available: list.filter((m) => m.available).length,
    unavailable: unavailable.length,
    orphanRecipe: orphanRecipe.length,
    inactiveFeatured: inactiveFeatured.length,
    featured: featured.length,
    avgPrice: list.length
      ? Math.round(list.reduce((s, m) => s + m.price, 0) / list.length)
      : 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      available: list.filter((m) => m.available).length,
      unavailable: unavailable.length,
      orphan_recipe: orphanRecipe.length,
      inactive_featured: inactiveFeatured.length,
      featured: featured.length,
    },
    summaryLines: [
      `Kalem ${list.length} · açık ${list.filter((m) => m.available).length} · kapalı ${unavailable.length}`,
      `Yetim reçete ${orphanRecipe.length} · pasif featured ${inactiveFeatured.length} · menu flag ${openFlags.length} açık`,
    ],
  };
}

export function runMenuSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = menuSummary();
  const existing = readCollection('menu-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.unavailable || 0) > 0) {
    candidates.push({
      key: 'menu_unavailable_items',
      level: (overview.unavailable || 0) > 0 ? 'warn' : 'info',
      text: `Kapalı menü kalemi ${overview.unavailable || 0}`,
      domain: 'availability',
    });
  }
  if (force || (overview.orphanRecipe || 0) > 0) {
    candidates.push({
      key: 'menu_orphan_recipe',
      level: (overview.orphanRecipe || 0) > 0 ? 'alert' : 'info',
      text: `Yetim recipeId ${overview.orphanRecipe || 0}`,
      domain: 'recipes',
    });
  }
  if (force || (overview.inactiveFeatured || 0) > 0) {
    candidates.push({
      key: 'menu_inactive_featured',
      level: (overview.inactiveFeatured || 0) > 0 ? 'warn' : 'info',
      text: `Featured ama kapalı ${overview.inactiveFeatured || 0}`,
      domain: 'featured',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('menf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('menu-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `menu sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('mens'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('menu-sweeps', sweep, 80);
  appendAudit({ actor, action: 'menu.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: menuSummary() };
}

export function ackMenuFlag(input = {}, actor = 'system') {
  const list = readCollection('menu-flags', []) || [];
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
  writeCollection('menu-flags', list);
  appendAudit({ actor, action: 'menu.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: menuSummary() };
}

/** Mutator 1 — mark an item unavailable with an operational reason. */
export function markMenuItemUnavailable(input = {}, actor = 'system') {
  let target = null;
  if (input.id) target = ensureSeed().find((m) => m.id === input.id);
  if (!target) target = listMenu().find((m) => m.available) || listMenu()[0];
  if (!target) return { ok: false, error: 'Menü kalemi yok' };
  const item = updateMenuItem(
    target.id,
    {
      available: false,
      unavailableReason: String(input.reason || input.note || 'ops unavailable').slice(0, 240),
    },
    actor,
  );
  appendAudit({ actor, action: 'menu.mark_unavailable', detail: item?.name || target.name, meta: { id: target.id } });
  return { ok: true, item, unavailable: item ? [item.id] : [], overview: menuSummary() };
}

/** Mutator 2 — clear recipe IDs that no longer point at known recipes. */
export function repairMenuRecipeLinks(input = {}, actor = 'system') {
  const recipeIds = new Set(listRecipes().map((r) => r.id));
  const repaired = [];
  for (const row of listMenu().filter((m) => m.recipeId && !recipeIds.has(m.recipeId)).slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const item = updateMenuItem(row.id, { recipeId: null }, actor);
    if (item) repaired.push(item.id);
  }
  if (!repaired.length && input.seed !== false) {
    const target = listMenu().find((m) => !m.recipeId) || listMenu()[0];
    if (target) {
      updateMenuItem(target.id, { recipeId: `missing_${Date.now().toString(36)}` }, actor);
      const item = updateMenuItem(target.id, { recipeId: null }, actor);
      if (item) repaired.push(item.id);
    }
  }
  appendAudit({ actor, action: 'menu.repair_recipe_links', detail: `${repaired.length}`, meta: { n: repaired.length } });
  return { ok: true, repaired, overview: menuSummary() };
}

/** Mutator 3 — feature an available menu item and keep featured items sellable. */
export function featureMenuItem(input = {}, actor = 'system') {
  let target = null;
  if (input.id) target = ensureSeed().find((m) => m.id === input.id);
  if (!target) target = listMenu().find((m) => m.available) || listMenu()[0];
  if (!target) return { ok: false, error: 'Menü kalemi yok' };
  const item = updateMenuItem(
    target.id,
    {
      available: true,
      featured: true,
      featuredAt: new Date().toISOString(),
      unavailableReason: undefined,
    },
    actor,
  );
  appendAudit({ actor, action: 'menu.feature', detail: item?.name || target.name, meta: { id: target.id } });
  return { ok: true, item, featured: item ? [item.id] : [], overview: menuSummary() };
}
