/**
 * AŞAMA 33 — Mutfak reçete kartları (stok bağlantılı).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { adjustStock, listInventory } from './inventory.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensureSeed() {
  let list = readCollection('recipes', null);
  if (!Array.isArray(list) || list.length === 0) {
    const inv = listInventory();
    const kofte = inv.find((i) => i.id === 'inv_kofte');
    const ayran = inv.find((i) => i.id === 'inv_ayran');
    list = [
      {
        id: 'rcp_kofte_menu',
        name: 'Köfte menü',
        venueId: 'venue_kaleici',
        brandId: 'brand_daze',
        prepMinutes: 8,
        ingredients: [
          { itemId: kofte?.id || 'inv_kofte', name: 'Köfte porsiyon', qty: 1 },
          { itemId: ayran?.id || 'inv_ayran', name: 'Ayran', qty: 1 },
        ],
        steps: ['Izgara 4 dk', 'Porsiyonla', 'Ayran ekle', 'ETHOS gülümsemesi'],
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];
    writeCollection('recipes', list);
  }
  return list;
}

function stockMap() {
  return new Map(listInventory().map((i) => [i.id, i]));
}

function ingredientShortages(recipe, portions = 1) {
  const inv = stockMap();
  const n = Math.max(1, Number(portions) || 1);
  const missing = [];
  for (const ing of recipe.ingredients || []) {
    if (!ing.itemId) {
      missing.push({ name: ing.name || 'Malzeme', required: Math.abs(Number(ing.qty) || 1) * n, available: 0, reason: 'itemId yok' });
      continue;
    }
    const item = inv.get(ing.itemId);
    const required = Math.abs(Number(ing.qty) || 1) * n;
    const available = Number(item?.qty ?? 0);
    if (!item || available < required) {
      missing.push({
        itemId: ing.itemId,
        name: ing.name || item?.name || ing.itemId,
        required,
        available,
        reason: item ? 'stok yetersiz' : 'stok kartı yok',
      });
    }
  }
  return missing;
}

function recipeCost(recipe) {
  const inv = stockMap();
  const defaults = { KF: 85, AY: 14, CY: 4, RF: 18 };
  let total = 0;
  for (const ing of recipe.ingredients || []) {
    const item = ing.itemId ? inv.get(ing.itemId) : null;
    const skuPrefix = String(item?.sku || ing.sku || '').slice(0, 2).toUpperCase();
    const unitCost = Number(ing.unitCost ?? item?.unitCost ?? defaults[skuPrefix] ?? 10);
    total += Math.abs(Number(ing.qty) || 1) * unitCost;
  }
  return Math.round(total * 100) / 100;
}

export function listRecipes(filter = {}) {
  let list = ensureSeed();
  if (filter.venueId) list = list.filter((r) => r.venueId === filter.venueId);
  if (filter.brandId) list = list.filter((r) => r.brandId === filter.brandId);
  return list;
}

export function createRecipe(input, actor = 'system') {
  const recipe = {
    id: `rcp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'Reçete',
    venueId: input.venueId || null,
    brandId: input.brandId || 'brand_daze',
    prepMinutes: Number(input.prepMinutes) || 10,
    ingredients: Array.isArray(input.ingredients) ? input.ingredients : [],
    steps: Array.isArray(input.steps) ? input.steps : [],
    status: input.status || 'active',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('recipes', recipe, 200);
  appendAudit({
    actor,
    action: 'recipes.create',
    detail: recipe.name,
    meta: { id: recipe.id },
  });
  return recipe;
}

export function updateRecipe(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('recipes', list);
  appendAudit({ actor, action: 'recipes.update', detail: list[idx].name, meta: { id } });
  return list[idx];
}

export function removeRecipe(id, actor = 'system') {
  const r = ensureSeed().find((x) => x.id === id);
  if (!r) return null;
  deleteItem('recipes', id);
  appendAudit({ actor, action: 'recipes.delete', detail: r.name, meta: { id } });
  return r;
}

/** Reçeteyi pişir — malzemeleri stoktan düş */
export function cookRecipe(id, portions = 1, actor = 'system') {
  const recipe = ensureSeed().find((r) => r.id === id);
  if (!recipe) return null;
  const n = Math.max(1, Number(portions) || 1);
  const movements = [];
  for (const ing of recipe.ingredients || []) {
    if (!ing.itemId) continue;
    const result = adjustStock(
      {
        id: ing.itemId,
        delta: -Math.abs(Number(ing.qty) || 1) * n,
        reason: `recipe:${recipe.id}`,
      },
      actor,
    );
    if (result) movements.push(result.movement);
  }
  appendAudit({
    actor,
    action: 'recipes.cook',
    detail: `${recipe.name} ×${n}`,
    meta: { id, portions: n, movements: movements.length },
  });
  return { recipe, portions: n, movements };
}

export function recipesSummary() {
  const list = listRecipes();
  const flags = readCollection('recipes-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const active = list.filter((r) => r.status === 'active');
  const missing = active.filter((r) => ingredientShortages(r).length > 0);
  const staleCost = active.filter((r) => !r.costRefreshedAt || Date.now() - Date.parse(r.costRefreshedAt || 0) > 7 * 86400_000);
  return {
    title: 'LİKYA Reçete Ops',
    total: list.length,
    active: active.length,
    missingIngredients: missing.length,
    staleCosts: staleCost.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      active: active.length,
      missing_ingredients: missing.length,
      stale_costs: staleCost.length,
    },
    summaryLines: [
      `Reçete ${list.length} · aktif ${active.length} · eksik stoklu ${missing.length}`,
      `Maliyet yenileme bekleyen ${staleCost.length} · recipe flag ${openFlags.length} açık`,
    ],
  };
}

export function runRecipesSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = recipesSummary();
  const existing = readCollection('recipes-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.missingIngredients || 0) > 0) {
    candidates.push({
      key: 'ingredients_missing',
      level: (overview.missingIngredients || 0) > 0 ? 'warn' : 'info',
      text: `Eksik stoklu reçete ${overview.missingIngredients || 0}`,
      domain: 'ingredients',
    });
  }
  if (force || (overview.staleCosts || 0) > 0) {
    candidates.push({
      key: 'cost_stale',
      level: 'info',
      text: `Maliyet yenileme bekleyen ${overview.staleCosts || 0}`,
      domain: 'cost',
    });
  }
  if (force || (overview.active || 0) === 0) {
    candidates.push({
      key: 'active_recipe_gap',
      level: (overview.active || 0) === 0 ? 'alert' : 'info',
      text: `Aktif reçete ${overview.active || 0}`,
      domain: 'catalog',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('rcpf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('recipes-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `recipes sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('rcps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('recipes-sweeps', sweep, 80);
  appendAudit({ actor, action: 'recipes.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: recipesSummary() };
}

export function ackRecipesFlag(input = {}, actor = 'system') {
  const list = readCollection('recipes-flags', []) || [];
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
  writeCollection('recipes-flags', list);
  appendAudit({ actor, action: 'recipes.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: recipesSummary() };
}

/** Mutator 1 — cook the requested or first active recipe. */
export function cookRecipeOps(input = {}, actor = 'system') {
  let recipe = null;
  if (input.id || input.recipeId) recipe = ensureSeed().find((r) => r.id === (input.id || input.recipeId));
  if (!recipe) recipe = listRecipes().find((r) => r.status === 'active') || listRecipes()[0];
  if (!recipe) return { ok: false, error: 'Reçete yok' };
  const portions = Math.max(1, Number(input.portions) || 1);
  const shortages = ingredientShortages(recipe, portions);
  const result = cookRecipe(recipe.id, portions, actor);
  appendAudit({
    actor,
    action: 'recipes.cook_ops',
    detail: `${recipe.name} ×${portions}`,
    meta: { id: recipe.id, shortages: shortages.length },
  });
  return { ok: true, ...result, shortages, overview: recipesSummary() };
}

/** Mutator 2 — flag recipes whose ingredients are missing or under stock. */
export function flagMissingRecipeStock(input = {}, actor = 'system') {
  let rows = listRecipes().filter((r) => r.status === 'active' && ingredientShortages(r).length > 0);
  if (!rows.length && input.seed !== false) {
    createRecipe(
      {
        name: 'recipe missing-stock seed',
        ingredients: [{ itemId: 'inv_missing_seed', name: 'Eksik stok seed', qty: 1 }],
        steps: ['stok kartını tamamla'],
      },
      actor,
    );
    rows = listRecipes().filter((r) => r.status === 'active' && ingredientShortages(r).length > 0);
  }
  const existing = readCollection('recipes-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    const missing = ingredientShortages(row);
    const key = `ingredients_missing_${row.id}`;
    if (openKeys.has(key)) continue;
    const flag = {
      id: rid('rcpf'),
      key,
      level: 'warn',
      text: `${row.name} eksik stok · ${missing.map((m) => m.name).join(', ')}`,
      domain: 'ingredients',
      recipe_id: row.id,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(flag);
    created.push(flag);
    openKeys.add(key);
  }
  writeCollection('recipes-flags', list.slice(0, 200));
  appendAudit({ actor, action: 'recipes.missing_stock_flag', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, created, overview: recipesSummary() };
}

/** Mutator 3 — refresh estimated recipe costs from ingredient cards. */
export function refreshRecipeCosts(input = {}, actor = 'system') {
  const refreshed = [];
  const rows = listRecipes().filter((r) => !input.id || r.id === input.id);
  for (const row of rows.slice(0, Number(input.limit) || 50)) {
    const next = updateRecipe(
      row.id,
      {
        estimatedCost: recipeCost(row),
        costRefreshedAt: new Date().toISOString(),
      },
      actor,
    );
    if (next) refreshed.push(next.id);
  }
  appendAudit({ actor, action: 'recipes.cost_refresh', detail: `${refreshed.length}`, meta: { n: refreshed.length } });
  return { ok: true, refreshed, overview: recipesSummary() };
}
