/**
 * AŞAMA 405 — Odyssey checkpoint.
 */
import { buildZenith } from './zenith.js';
import { createOkrrack, listOkrrack, okrrackSummary, updateOkrrack } from './okrrack.js';
import { createBetboard, listBetboard, betboardSummary, updateBetboard } from './betboard.js';
import { createPortfoliorisk, listPortfoliorisk, portfolioriskSummary, updatePortfoliorisk } from './portfoliorisk.js';
import { createExpansion, listExpansion, expansionSummary, updateExpansion } from './expansion.js';
import { createMoatwatch, listMoatwatch, moatwatchSummary, updateMoatwatch } from './moatwatch.js';
import { createNorthstar, listNorthstar, northstarSummary, updateNorthstar } from './northstar.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildOdyssey() {
  const prev = buildZenith();
  const okr = okrrackSummary();
  const bet = betboardSummary();
  const risk = portfolioriskSummary();
  const exp = expansionSummary();
  const moat = moatwatchSummary();
  const star = northstarSummary();
  const flags = readCollection('odyssey-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Odyssey',
    zenith: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    okrRisk: okr.at_risk || 0,
    betsOpen: bet.open || 0,
    riskHigh: risk.high || 0,
    expansionScout: exp.scout || 0,
    moatEroding: moat.eroding || 0,
    starMiss: star.miss || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      okr_risk: okr.at_risk || 0,
      risk_high: risk.high || 0,
      moat_eroding: moat.eroding || 0,
      star_miss: star.miss || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `OKR at risk ${okr.at_risk || 0} · Strategic bets open ${bet.open || 0}`,
      `Portfolio risk high ${risk.high || 0} · Expansion scout ${exp.scout || 0}`,
      `Moat eroding ${moat.eroding || 0} · North star miss ${star.miss || 0}`,
      `Odyssey flag ${openFlags.length} açık`,
    ],
  };
}

export function runOdysseySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildOdyssey();
  const existing = readCollection('odyssey-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.okrRisk || 0) > 0)) {
    candidates.push({ key: 'okr_risk', level: 'alert', text: `OKR at risk ${o.okrRisk || 0}`, domain: 'okr' });
  }
  if (force || ((o.riskHigh || 0) > 0 || (o.moatEroding || 0) > 0)) {
    candidates.push({ key: 'strat_risk', level: 'warn', text: `Risk high ${o.riskHigh || 0} · Moat ${o.moatEroding || 0}`, domain: 'risk' });
  }
  if (force || ((o.starMiss || 0) > 0 || (o.betsOpen || 0) > 0)) {
    candidates.push({ key: 'north', level: 'info', text: `Star miss ${o.starMiss || 0} · Bets ${o.betsOpen || 0}`, domain: 'star' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Odyssey heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('odf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('odyssey-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `odyssey sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ods'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('odyssey-sweeps', sweep, 80);
  appendAudit({ actor, action: 'odyssey.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildOdyssey() };
}

export function ackOdysseyFlag(input = {}, actor = 'system') {
  const list = readCollection('odyssey-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('odyssey-flags', list);
  appendAudit({ actor, action: 'odyssey.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildOdyssey() };
}

export function recoverOdysseyOkr(input = {}, actor = 'system') {
  const rows = listOkrrack().filter((x) => x.status === 'at_risk' || x.status === 'missed');
  const recovered = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateOkrrack(row.id, { status: 'on_track', touched_by: actor }, actor);
    if (next) recovered.push(next.id);
  }
  if (!recovered.length) {
    const seeded = createOkrrack({ objective: 'odyssey', kr: 'kr1', status: 'on_track' }, actor);
    recovered.push(seeded.id);
  }
  appendAudit({ actor, action: 'odyssey.okr_recover', detail: `${recovered.length}`, meta: { n: recovered.length } });
  return { ok: true, recovered, overview: buildOdyssey() };
}

export function coolOdysseyRisk(input = {}, actor = 'system') {
  const rows = listPortfoliorisk().filter((x) => x.status === 'high' || x.status === 'medium');
  const cooled = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePortfoliorisk(row.id, { status: 'low', touched_by: actor }, actor);
    if (next) cooled.push(next.id);
  }
  if (!cooled.length) {
    const seeded = createPortfoliorisk({ asset: 'odyssey', score: 20, status: 'low' }, actor);
    cooled.push(seeded.id);
  }
  for (const m of listMoatwatch().filter((x) => x.status === 'eroding' || x.status === 'weak').slice(0, 5)) { updateMoatwatch(m.id, { status: 'strong', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'odyssey.risk_cool', detail: `${cooled.length}`, meta: { n: cooled.length } });
  return { ok: true, cooled, overview: buildOdyssey() };
}

export function hitOdysseyStar(input = {}, actor = 'system') {
  const rows = listNorthstar().filter((x) => x.status === 'miss' || x.status === 'tracking');
  const hit = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNorthstar(row.id, { status: 'hit', touched_by: actor }, actor);
    if (next) hit.push(next.id);
  }
  if (!hit.length) {
    const seeded = createNorthstar({ metric: 'NPS', value: 80, status: 'hit' }, actor);
    hit.push(seeded.id);
  }
  for (const b of listBetboard().filter((x) => x.status === 'open').slice(0, 5)) { updateBetboard(b.id, { status: 'winning', touched_by: actor }, actor); }
  for (const e of listExpansion().filter((x) => x.status === 'scout').slice(0, 5)) { updateExpansion(e.id, { status: 'build', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ETHOS', title: `odyssey star_hit · ${hit.length}`, priority: 'normal', payload: { ids: hit } }, actor);
  appendAudit({ actor, action: 'odyssey.star_hit', detail: `${hit.length}`, meta: { n: hit.length } });
  return { ok: true, hit, overview: buildOdyssey() };
}
