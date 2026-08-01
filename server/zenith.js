/**
 * AŞAMA 390 — Zenith checkpoint.
 */
import { buildKeystone } from './keystone.js';
import { createPickuppace, listPickuppace, pickuppaceSummary, updatePickuppace } from './pickuppace.js';
import { createNoshowrisk, listNoshowrisk, noshowriskSummary, updateNoshowrisk } from './noshowrisk.js';
import { createPricefloor, listPricefloor, pricefloorSummary, updatePricefloor } from './pricefloor.js';
import { createMarginwatch, listMarginwatch, marginwatchSummary, updateMarginwatch } from './marginwatch.js';
import { createBeatrevenue, listBeatrevenue, beatrevenueSummary, updateBeatrevenue } from './beatrevenue.js';
import { createWalkinflow, listWalkinflow, walkinflowSummary, updateWalkinflow } from './walkinflow.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildZenith() {
  const prev = buildKeystone();
  const pace = pickuppaceSummary();
  const noshow = noshowriskSummary();
  const floor = pricefloorSummary();
  const margin = marginwatchSummary();
  const beat = beatrevenueSummary();
  const walk = walkinflowSummary();
  const flags = readCollection('zenith-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Zenith',
    keystone: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    paceBehind: pace.behind || 0,
    noshowHigh: noshow.high || 0,
    floorBreached: floor.breached || 0,
    marginNeg: margin.negative || 0,
    beatBelow: beat.below || 0,
    walkSurge: walk.surge || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      pace_behind: pace.behind || 0,
      floor_breached: floor.breached || 0,
      margin_neg: margin.negative || 0,
      beat_below: beat.below || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Pickup behind ${pace.behind || 0} · No-show high ${noshow.high || 0}`,
      `Price floor breached ${floor.breached || 0} · Margin negative ${margin.negative || 0}`,
      `Beat below ${beat.below || 0} · Walk-in surge ${walk.surge || 0}`,
      `Zenith flag ${openFlags.length} açık`,
    ],
  };
}

export function runZenithSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildZenith();
  const existing = readCollection('zenith-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.paceBehind || 0) > 0 || (o.beatBelow || 0) > 0)) {
    candidates.push({ key: 'pace', level: 'alert', text: `Pace behind ${o.paceBehind || 0} · Beat ${o.beatBelow || 0}`, domain: 'pace' });
  }
  if (force || ((o.floorBreached || 0) > 0 || (o.marginNeg || 0) > 0)) {
    candidates.push({ key: 'margin', level: 'warn', text: `Floor ${o.floorBreached || 0} · Margin neg ${o.marginNeg || 0}`, domain: 'margin' });
  }
  if (force || ((o.noshowHigh || 0) > 0 || (o.walkSurge || 0) > 0)) {
    candidates.push({ key: 'demand', level: 'info', text: `No-show high ${o.noshowHigh || 0} · Walk surge ${o.walkSurge || 0}`, domain: 'demand' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Zenith heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('znf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('zenith-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'MINT', title: `zenith sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('zns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('zenith-sweeps', sweep, 80);
  appendAudit({ actor, action: 'zenith.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildZenith() };
}

export function ackZenithFlag(input = {}, actor = 'system') {
  const list = readCollection('zenith-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('zenith-flags', list);
  appendAudit({ actor, action: 'zenith.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildZenith() };
}

export function catchZenithPace(input = {}, actor = 'system') {
  const rows = listPickuppace().filter((x) => x.status === 'behind');
  const caught = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePickuppace(row.id, { status: 'on_pace', touched_by: actor }, actor);
    if (next) caught.push(next.id);
  }
  if (!caught.length) {
    const seeded = createPickuppace({ date: '2026-08-01', pace: 100, status: 'on_pace' }, actor);
    caught.push(seeded.id);
  }
  for (const b of listBeatrevenue().filter((x) => x.status === 'below').slice(0, 5)) {
    updateBeatrevenue(b.id, { status: 'above', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'zenith.pace_catch', detail: `${caught.length}`, meta: { n: caught.length } });
  return { ok: true, caught, overview: buildZenith() };
}

export function healZenithMargin(input = {}, actor = 'system') {
  const rows = listMarginwatch().filter((x) => x.status === 'negative' || x.status === 'thin');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateMarginwatch(row.id, { status: 'healthy', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createMarginwatch({ metric: 'adr', value: 10, status: 'healthy' }, actor);
    healed.push(seeded.id);
  }
  for (const f of listPricefloor().filter((x) => x.status === 'breached').slice(0, 5)) {
    updatePricefloor(f.id, { status: 'active', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'zenith.margin_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildZenith() };
}

export function coolZenithDemand(input = {}, actor = 'system') {
  const rows = listNoshowrisk().filter((x) => x.status === 'high' || x.status === 'medium');
  const cooled = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNoshowrisk(row.id, { status: 'low', touched_by: actor }, actor);
    if (next) cooled.push(next.id);
  }
  if (!cooled.length) {
    const seeded = createNoshowrisk({ segment: 'zenith', score: 5, status: 'low' }, actor);
    cooled.push(seeded.id);
  }
  for (const w of listWalkinflow().filter((x) => x.status === 'surge').slice(0, 5)) {
    updateWalkinflow(w.id, { status: 'normal', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'MINT', title: `zenith demand_cool · ${cooled.length}`, priority: 'normal', payload: { ids: cooled } }, actor);
  appendAudit({ actor, action: 'zenith.demand_cool', detail: `${cooled.length}`, meta: { n: cooled.length } });
  return { ok: true, cooled, overview: buildZenith() };
}
