/**
 * AŞAMA 210 — Sentinel checkpoint.
 */
import { buildSkyline } from './skyline.js';
import { createLostchild, listLostchild, lostchildSummary, updateLostchild } from './lostchild.js';
import { createFirstaid, listFirstaid, firstaidSummary, updateFirstaid } from './firstaid.js';
import { createCrowddens, listCrowddens, crowddensSummary, updateCrowddens } from './crowddens.js';
import { createGatequeue, listGatequeue, gatequeueSummary, updateGatequeue } from './gatequeue.js';
import { createWatchlist, listWatchlist, watchlistSummary, updateWatchlist } from './watchlist.js';
import { createAedcheck, listAedcheck, aedcheckSummary, updateAedcheck } from './aedcheck.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildSentinel() {
  const prev = buildSkyline();
  const lost = lostchildSummary();
  const aid = firstaidSummary();
  const crowd = crowddensSummary();
  const gate = gatequeueSummary();
  const watch = watchlistSummary();
  const aed = aedcheckSummary();
  const flags = readCollection('sentinel-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Sentinel',
    skyline: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    lostOpen: lost.open || 0,
    firstaidOpen: aid.open || 0,
    crowdHigh: crowd.high || 0,
    gateStop: gate.stop || 0,
    watchActive: watch.active || 0,
    aedMissing: aed.missing || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      lost_open: lost.open || 0,
      firstaid_open: aid.open || 0,
      gate_stop: gate.stop || 0,
      aed_missing: aed.missing || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Kayıp çocuk açık ${lost.open || 0} · İlk yardım açık ${aid.open || 0}`,
      `Yoğunluk high ${crowd.high || 0} · Gate stop ${gate.stop || 0}`,
      `Watchlist aktif ${watch.active || 0} · AED missing ${aed.missing || 0}`,
      `Sentinel flag ${openFlags.length} açık`,
    ],
  };
}

export function runSentinelSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSentinel();
  const existing = readCollection('sentinel-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.lostOpen || 0) > 0)) {
    candidates.push({ key: 'lost', level: 'alert', text: `Kayıp çocuk ${o.lostOpen || 0}`, domain: 'lost' });
  }
  if (force || ((o.aedMissing || 0) > 0 || (o.firstaidOpen || 0) > 0)) {
    candidates.push({ key: 'medical', level: 'alert', text: `AED missing ${o.aedMissing || 0} · First aid ${o.firstaidOpen || 0}`, domain: 'medical' });
  }
  if (force || ((o.gateStop || 0) > 0 || (o.crowdHigh || 0) > 0)) {
    candidates.push({ key: 'crowd_gate', level: 'warn', text: `Gate stop ${o.gateStop || 0} · Crowd high ${o.crowdHigh || 0}`, domain: 'crowd' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Sentinel heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('sef'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('sentinel-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'VALKYRIE', title: `sentinel sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ses'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('sentinel-sweeps', sweep, 80);
  appendAudit({ actor, action: 'sentinel.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSentinel() };
}

export function ackSentinelFlag(input = {}, actor = 'system') {
  const list = readCollection('sentinel-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('sentinel-flags', list);
  appendAudit({ actor, action: 'sentinel.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSentinel() };
}

export function resolveSentinelLost(input = {}, actor = 'system') {
  const rows = listLostchild().filter((x) => x.status === 'open');
  const resolved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLostchild(row.id, { status: 'found', touched_by: actor }, actor);
    if (next) resolved.push(next.id);
  }
  if (!resolved.length) {
    const seeded = createLostchild({ childName: 'sentinel', zone: 'plaza', status: 'found' }, actor);
    resolved.push(seeded.id);
  }
  appendAudit({ actor, action: 'sentinel.lost_resolve', detail: `${resolved.length}`, meta: { n: resolved.length } });
  return { ok: true, resolved, overview: buildSentinel() };
}

export function serviceSentinelAed(input = {}, actor = 'system') {
  const rows = listAedcheck().filter((x) => x.status === 'missing' || x.status === 'service');
  const serviced = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAedcheck(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) serviced.push(next.id);
  }
  if (!serviced.length) {
    const seeded = createAedcheck({ unit: 'AED1', location: 'lobby', status: 'ok' }, actor);
    serviced.push(seeded.id);
  }
  for (const a of listFirstaid().filter((x) => x.status === 'open').slice(0, 5)) { updateFirstaid(a.id, { status: 'treated', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'sentinel.aed_service', detail: `${serviced.length}`, meta: { n: serviced.length } });
  return { ok: true, serviced, overview: buildSentinel() };
}

export function flowSentinelGate(input = {}, actor = 'system') {
  const rows = listGatequeue().filter((x) => x.status === 'stop' || x.status === 'slow');
  const flowed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateGatequeue(row.id, { status: 'flow', touched_by: actor }, actor);
    if (next) flowed.push(next.id);
  }
  if (!flowed.length) {
    const seeded = createGatequeue({ gate: 'G1', waiting: 0, status: 'flow' }, actor);
    flowed.push(seeded.id);
  }
  for (const c of listCrowddens().filter((x) => x.status === 'high').slice(0, 5)) { updateCrowddens(c.id, { status: 'normal', touched_by: actor }, actor); }
  for (const w of listWatchlist().filter((x) => x.status === 'active').slice(0, 5)) { updateWatchlist(w.id, { status: 'cleared', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'VALKYRIE', title: `sentinel gate_flow · ${flowed.length}`, priority: 'high', payload: { ids: flowed } }, actor);
  appendAudit({ actor, action: 'sentinel.gate_flow', detail: `${flowed.length}`, meta: { n: flowed.length } });
  return { ok: true, flowed, overview: buildSentinel() };
}
