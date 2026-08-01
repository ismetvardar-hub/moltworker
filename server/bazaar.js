/**
 * AŞAMA 660 — Bazaar checkpoint.
 */
import { buildEmpire } from './empire.js';
import { createRetailfloor, listRetailfloor, retailfloorSummary, updateRetailfloor } from './retailfloor.js';
import { createPlanogram, listPlanogram, planogramSummary, updatePlanogram } from './planogram.js';
import { createShrinklog, listShrinklog, shrinklogSummary, updateShrinklog } from './shrinklog.js';
import { createStockhealth, listStockhealth, stockhealthSummary, updateStockhealth } from './stockhealth.js';
import { createDarkstore, listDarkstore, darkstoreSummary, updateDarkstore } from './darkstore.js';
import { createPromoplane, listPromoplane, promoplaneSummary, updatePromoplane } from './promoplane.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildBazaar() {
  const prev = buildEmpire();
  const floor = retailfloorSummary();
  const plano = planogramSummary();
  const shrink = shrinklogSummary();
  const stock = stockhealthSummary();
  const dark = darkstoreSummary();
  const promo = promoplaneSummary();
  const flags = readCollection('bazaar-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Bazaar',
    empire: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    floorBusy: floor.busy || 0,
    planoGap: plano.gap || 0,
    shrinkLogged: shrink.logged || 0,
    stockRed: stock.red || 0,
    darkPicking: dark.picking || 0,
    promoLive: promo.live || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      stock_red: stock.red || 0,
      plano_gap: plano.gap || 0,
      shrink_logged: shrink.logged || 0,
      floor_busy: floor.busy || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Retail floor busy ${floor.busy || 0} · Planogram gaps ${plano.gap || 0}`,
      `Shrink logged ${shrink.logged || 0} · Stock health red ${stock.red || 0}`,
      `Dark store picking ${dark.picking || 0} · Promos live ${promo.live || 0}`,
      `Bazaar flag ${openFlags.length} açık`,
    ],
  };
}

export function runBazaarSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildBazaar();
  const existing = readCollection('bazaar-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.stockRed || 0) > 0)) {
    candidates.push({ key: 'stock_red', level: 'alert', text: `Stock red ${o.stockRed || 0}`, domain: 'stock' });
  }
  if (force || ((o.planoGap || 0) > 0)) {
    candidates.push({ key: 'plano_gap', level: 'warn', text: `Planogram gap ${o.planoGap || 0}`, domain: 'plano' });
  }
  if (force || ((o.shrinkLogged || 0) > 0 || (o.floorBusy || 0) > 0)) {
    candidates.push({ key: 'retail_pressure', level: 'info', text: `Shrink ${o.shrinkLogged || 0} · Floor busy ${o.floorBusy || 0}`, domain: 'retail' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Bazaar heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('bzf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('bazaar-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'AGORA', title: `bazaar sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('bzs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bazaar-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bazaar.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildBazaar() };
}

export function ackBazaarFlag(input = {}, actor = 'system') {
  const list = readCollection('bazaar-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('bazaar-flags', list);
  appendAudit({ actor, action: 'bazaar.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildBazaar() };
}

export function healBazaarStock(input = {}, actor = 'system') {
  const rows = listStockhealth().filter((x) => x.status === 'red' || x.status === 'amber');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateStockhealth(row.id, { status: 'green', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createStockhealth({ sku: 'BZ1', score: 90, status: 'green' }, actor);
    healed.push(seeded.id);
  }
  for (const p of listPlanogram().filter((x) => x.status === 'gap').slice(0, 5)) { updatePlanogram(p.id, { status: 'ok', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'bazaar.stock_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildBazaar() };
}

export function reviewBazaarShrink(input = {}, actor = 'system') {
  const rows = listShrinklog().filter((x) => x.status === 'logged');
  const reviewed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateShrinklog(row.id, { status: 'reviewed', touched_by: actor }, actor);
    if (next) reviewed.push(next.id);
  }
  if (!reviewed.length) {
    const seeded = createShrinklog({ sku: 'BZ1', qty: 1, status: 'reviewed' }, actor);
    reviewed.push(seeded.id);
  }
  appendAudit({ actor, action: 'bazaar.shrink_review', detail: `${reviewed.length}`, meta: { n: reviewed.length } });
  return { ok: true, reviewed, overview: buildBazaar() };
}

export function dispatchBazaarDark(input = {}, actor = 'system') {
  const rows = listDarkstore().filter((x) => x.status === 'picking' || x.status === 'idle');
  const dispatched = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDarkstore(row.id, { status: 'dispatch', touched_by: actor }, actor);
    if (next) dispatched.push(next.id);
  }
  if (!dispatched.length) {
    const seeded = createDarkstore({ hub: 'B1', orders: 1, status: 'dispatch' }, actor);
    dispatched.push(seeded.id);
  }
  for (const f of listRetailfloor().filter((x) => x.status === 'busy').slice(0, 5)) { updateRetailfloor(f.id, { status: 'open', touched_by: actor }, actor); }
  for (const p of listPromoplane().filter((x) => x.status === 'planned').slice(0, 5)) { updatePromoplane(p.id, { status: 'live', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'AGORA', title: `bazaar dark_dispatch · ${dispatched.length}`, priority: 'normal', payload: { ids: dispatched } }, actor);
  appendAudit({ actor, action: 'bazaar.dark_dispatch', detail: `${dispatched.length}`, meta: { n: dispatched.length } });
  return { ok: true, dispatched, overview: buildBazaar() };
}
