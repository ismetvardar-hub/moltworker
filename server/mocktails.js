import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 178 - Mocktail recipe ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('mocktails', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mck_1',
      drink: "Sunset Cooler",
      qty: "2",
      status: 'ordered',
      at: new Date().toISOString(),
    }];
    writeCollection('mocktails', seed);
    return seed;
  }
  return list;
}

function openMocktailsFlags() {
  const flags = readCollection('mocktails-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMocktailsFlag(candidate, actor = 'system') {
  const existing = readCollection('mocktails-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('mckf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('mocktails-flags', list.slice(0, 200));
  return flag;
}

function isRecipeGap(row) {
  return row.recipeGap === true || row.status === 'recipe_gap' || Boolean(row.recipeGapAt);
}

function isFeaturedDrink(row) {
  return row.featuredDrink === true || row.status === 'featured' || Boolean(row.featuredAt);
}

function isSunsetFlight(row) {
  return row.sunsetFlight === true || row.flightType === 'sunset';
}

export function listMocktails(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createMocktails(input = {}, actor = 'system') {
  const row = {
    id: rid('mck'),
    drink: input.drink !== undefined ? input.drink : "Sunset Cooler",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 2,
    recipe: input.recipe !== undefined ? input.recipe : undefined,
    flightType: input.flightType !== undefined ? input.flightType : undefined,
    sunsetFlight: input.sunsetFlight === true || undefined,
    status: input.status || 'ordered',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mocktails', row, 300);
  appendAudit({
    actor,
    action: 'mocktails.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMocktails(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  list[idx] = next;
  writeCollection('mocktails', list);
  appendAudit({ actor, action: 'mocktails.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function mocktailsSummary() {
  const list = listMocktails();
  const recipeGaps = list.filter(isRecipeGap);
  const featuredDrinks = list.filter(isFeaturedDrink);
  const sunsetFlights = list.filter(isSunsetFlight);
  const flags = openMocktailsFlags();
  return {
    title: 'LIKYA Mocktails Ops',
    total: list.length,
    ordered: list.filter((x) => x.status === 'ordered').length,
    served: list.filter((x) => x.status === 'served').length,
    void: list.filter((x) => x.status === 'void').length,
    recipeGaps: recipeGaps.length,
    featuredDrinks: featuredDrinks.length,
    sunsetFlights: sunsetFlights.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ordered: list.filter((x) => x.status === 'ordered').length,
      served: list.filter((x) => x.status === 'served').length,
      void: list.filter((x) => x.status === 'void').length,
      recipe_gaps: recipeGaps.length,
      featured_drinks: featuredDrinks.length,
      sunset_flights: sunsetFlights.length,
    },
    summaryLines: [
      `Mocktails ${list.length} drink - recipe gaps ${recipeGaps.length} - featured ${featuredDrinks.length}`,
      `Ordered ${list.filter((x) => x.status === 'ordered').length} - sunset flights ${sunsetFlights.length} - flag ${flags.length}`,
    ],
    mocktails: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runMocktailsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = mocktailsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.recipeGaps > 0) {
    candidates.push({
      key: 'mocktails_recipe_gap',
      level: overview.recipeGaps > 0 ? 'warn' : 'info',
      text: `Mocktails recipe gaps ${overview.recipeGaps}`,
      domain: 'recipe',
    });
  }
  if (force || overview.featuredDrinks === 0) {
    candidates.push({
      key: 'mocktails_feature_drink_needed',
      level: overview.featuredDrinks === 0 ? 'warn' : 'info',
      text: `Mocktails featured drinks ${overview.featuredDrinks}`,
      domain: 'feature',
    });
  }
  if (force || overview.sunsetFlights === 0) {
    candidates.push({
      key: 'mocktails_sunset_flight_seed',
      level: 'info',
      text: `Mocktails sunset flights ${overview.sunsetFlights}`,
      domain: 'flight',
    });
  }
  for (const candidate of candidates) {
    const flag = addMocktailsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `mocktails sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('mcks'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('mocktails-sweeps', sweep, 80);
  appendAudit({ actor, action: 'mocktails.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: mocktailsSummary() };
}

export function ackMocktailsFlag(input = {}, actor = 'system') {
  const list = readCollection('mocktails-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('mocktails-flags', list);
  appendAudit({ actor, action: 'mocktails.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: mocktailsSummary() };
}

export function markMocktailsRecipeGap(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.drink && x.drink === input.drink));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isRecipeGap(x));
  if (idx < 0) return { ok: false, error: 'Recipe gap yapilacak mocktail yok' };
  list[idx] = {
    ...list[idx],
    status: 'recipe_gap',
    recipeGap: true,
    gapReason: input.reason || input.gapReason || 'missing_batch_card',
    recipeGapAt: input.recipeGapAt || new Date().toISOString(),
    recipeGapBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('mocktails', list);
  appendAudit({ actor, action: 'mocktails.recipe_gap', detail: list[idx].drink || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, drink: list[idx], overview: mocktailsSummary() };
}

export function featureMocktailDrink(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.drink && x.drink === input.drink));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isRecipeGap(x) || x.status === 'ordered' || x.status === 'served');
  if (idx < 0) return { ok: false, error: 'Feature edilecek mocktail yok' };
  list[idx] = {
    ...list[idx],
    status: 'featured',
    recipeGap: false,
    featuredDrink: true,
    featureChannel: input.channel || input.featureChannel || 'pool-bar',
    featuredAt: input.featuredAt || new Date().toISOString(),
    featuredBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('mocktails', list);
  appendAudit({ actor, action: 'mocktails.feature_drink', detail: list[idx].drink || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, drink: list[idx], overview: mocktailsSummary() };
}

export function seedSunsetFlight(input = {}, actor = 'system') {
  const drink = createMocktails(
    {
      drink: input.drink || 'Wave 178 Sunset Flight',
      qty: Number(input.qty ?? 4) || 4,
      recipe: input.recipe || 'citrus, mint, pomegranate, soda',
      flightType: 'sunset',
      sunsetFlight: true,
      status: input.status || 'ordered',
    },
    actor,
  );
  appendAudit({ actor, action: 'mocktails.seed_sunset_flight', detail: drink.drink, meta: { id: drink.id } });
  return { ok: true, drink, overview: mocktailsSummary() };
}
