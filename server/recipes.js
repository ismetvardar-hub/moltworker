/**
 * AŞAMA 33 — Mutfak reçete kartları (stok bağlantılı).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { adjustStock, listInventory } from './inventory.js';

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
  return { total: list.length, active: list.filter((r) => r.status === 'active').length };
}
