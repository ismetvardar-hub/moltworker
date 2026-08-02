/**
 * AŞAMA 53 — Fire / atık günlüğü.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

export function listWaste(limit = 50) {
  return readCollection('waste-log', []).slice(0, limit);
}

export function logWaste(input, actor = 'system') {
  const entry = {
    id: `wst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: String(input.item || '').trim() || 'Kalem',
    qty: Math.max(0, Number(input.qty) || 0),
    unit: input.unit || 'adet',
    reason: input.reason || 'spoilage',
    venueId: input.venueId || 'venue_kaleici',
    costTry: Math.max(0, Number(input.costTry) || 0),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('waste-log', entry, 400);
  appendAudit({
    actor,
    action: 'waste.log',
    detail: `${entry.item}: ${entry.qty} ${entry.unit} (${entry.reason})`,
    meta: { id: entry.id, costTry: entry.costTry },
  });
  return entry;
}

export function wasteSummary() {
  const list = listWaste(100);
  const today = new Date().toISOString().slice(0, 10);
  const todayList = list.filter((w) => w.at?.slice(0, 10) === today);
  const flags = readCollection('waste-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const categories = readCollection('waste-categories', []) || [];
  const categoryList = Array.isArray(categories) ? categories : [];
  const overages = todayList.filter((w) => Number(w.costTry || 0) >= 500 || Number(w.qty || 0) >= 10);
  const todayQty = todayList.reduce((s, w) => s + w.qty, 0);
  const todayCost = todayList.reduce((s, w) => s + (w.costTry || 0), 0);
  return {
    title: 'LİKYA Fire / Atık Ops',
    totalEntries: list.length,
    todayQty,
    todayCost,
    entries: list.slice(0, 30),
    categories: categoryList.slice(0, 30),
    flags: openFlags.slice(0, 30),
    overages: overages.length,
    summary: {
      flags_open: openFlags.length,
      entries: list.length,
      today_qty: todayQty,
      today_cost_try: todayCost,
      overages: overages.length,
      categories: categoryList.length,
    },
    summaryLines: [
      `Fire ${list.length} kayıt · bugün ${todayQty} birim · ${todayCost} TRY`,
      `Overage ${overages.length} · kategori ${categoryList.length} · flag ${openFlags.length}`,
    ],
  };
}

function addWasteFlag(candidate, actor = 'system') {
  const existing = readCollection('waste-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('wstf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('waste-flags', list.slice(0, 200));
  return flag;
}

export function runWasteSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = wasteSummary();
  const created = [];
  const candidates = [];
  if (force || (overview.overages || 0) > 0) {
    candidates.push({
      key: 'waste_daily_overage',
      level: (overview.overages || 0) > 0 ? 'alert' : 'info',
      text: `Fire overage kayıtları ${overview.overages || 0}`,
      domain: 'overage',
    });
  }
  if (force || (overview.summary?.categories || 0) === 0) {
    candidates.push({
      key: 'waste_missing_categories',
      level: (overview.summary?.categories || 0) === 0 ? 'warn' : 'info',
      text: `Atık kategori sayısı ${overview.summary?.categories || 0}`,
      domain: 'category',
    });
  }
  for (const c of candidates) {
    const flag = addWasteFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `waste sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('wsts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('waste-sweeps', sweep, 80);
  appendAudit({ actor, action: 'waste.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: wasteSummary() };
}

export function ackWasteFlag(input = {}, actor = 'system') {
  const list = readCollection('waste-flags', []) || [];
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
  writeCollection('waste-flags', list);
  appendAudit({ actor, action: 'waste.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: wasteSummary() };
}

/** Mutator 1 — log waste through the existing waste helper. */
export function recordWasteLog(input = {}, actor = 'system') {
  const entry = logWaste(
    {
      item: input.item || 'Ops fire kalemi',
      qty: Number(input.qty) || 2,
      unit: input.unit || 'adet',
      reason: input.reason || 'ops-log',
      venueId: input.venueId || 'venue_kaleici',
      costTry: Number(input.costTry) || 120,
    },
    actor,
  );
  return { ok: true, entry, overview: wasteSummary() };
}

/** Mutator 2 — seed a high-cost waste entry and flag overage. */
export function flagWasteOverage(input = {}, actor = 'system') {
  const entry = logWaste(
    {
      item: input.item || 'Ops overage fire',
      qty: Number(input.qty) || 12,
      unit: input.unit || 'kg',
      reason: input.reason || 'overage',
      venueId: input.venueId || 'venue_kaleici',
      costTry: Number(input.costTry) || 750,
    },
    actor,
  );
  const flag = addWasteFlag(
    {
      key: `waste_manual_overage_${entry.id}`,
      level: 'alert',
      text: `Fire overage ${entry.item}: ${entry.qty} ${entry.unit} / ${entry.costTry} TRY`,
      domain: 'overage',
      entryId: entry.id,
    },
    actor,
  );
  appendAudit({ actor, action: 'waste.flag_overage', detail: entry.item, meta: { entryId: entry.id, flagId: flag?.id } });
  return { ok: true, entry, flag, overview: wasteSummary() };
}

/** Mutator 3 — seed a waste category for reporting drills. */
export function seedWasteCategory(input = {}, actor = 'system') {
  const list = readCollection('waste-categories', []) || [];
  const categories = Array.isArray(list) ? list : [];
  const category = {
    id: input.id || rid('wcat'),
    name: input.name || 'Ops seed kategori',
    thresholdQty: Number(input.thresholdQty) || 10,
    thresholdCostTry: Number(input.thresholdCostTry) || 500,
    venueId: input.venueId || 'venue_kaleici',
    at: new Date().toISOString(),
    actor,
  };
  writeCollection('waste-categories', [category, ...categories].slice(0, 100));
  appendAudit({ actor, action: 'waste.seed_category', detail: category.name, meta: { id: category.id } });
  return { ok: true, category, overview: wasteSummary() };
}
