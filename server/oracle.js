/**
 * AŞAMA 540 — Oracle checkpoint.
 */
import { buildAegis } from './aegis.js';
import { createFeatureflag, featureflagSummary, listFeatureflag, updateFeatureflag } from './featureflag.js';
import { createEvalbench, evalbenchSummary, listEvalbench, updateEvalbench } from './evalbench.js';
import { anomalySummary, createAnomaly, listAnomaly, updateAnomaly } from './anomaly.js';
import { vectorstoreSummary } from './vectorstore.js';
import { createScorecard, listScorecard, scorecardSummary, updateScorecard } from './scorecard.js';
import { abtestSummary } from './abtest.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildOracle() {
  const prev = buildAegis();
  const flag = featureflagSummary();
  const bench = evalbenchSummary();
  const anom = anomalySummary();
  const vec = vectorstoreSummary();
  const score = scorecardSummary();
  const ab = abtestSummary();
  const flags = readCollection('oracle-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Oracle',
    aegis: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    flagCanary: flag.canary || 0,
    evalFail: bench.fail || 0,
    anomOpen: anom.open || 0,
    vecStale: vec.stale || 0,
    scoreRed: score.red || 0,
    abRunning: ab.running || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      anom_open: anom.open || 0,
      score_red: score.red || 0,
      eval_fail: bench.fail || 0,
      flag_canary: flag.canary || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Feature canary ${flag.canary || 0} · Eval fail ${bench.fail || 0}`,
      `Anomaly open ${anom.open || 0} · Vector stale ${vec.stale || 0}`,
      `Scorecard red ${score.red || 0} · A/B running ${ab.running || 0}`,
      `Oracle flag ${openFlags.length} açık`,
    ],
  };
}

export function runOracleSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildOracle();
  const existing = readCollection('oracle-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.anomOpen || 0) > 0) {
    candidates.push({ key: 'anom_open', level: 'alert', text: `Anomaly open ${o.anomOpen || 0}`, domain: 'anomaly' });
  }
  if (force || (o.scoreRed || 0) > 0) {
    candidates.push({ key: 'score_red', level: 'alert', text: `Scorecard red ${o.scoreRed || 0}`, domain: 'score' });
  }
  if (force || (o.evalFail || 0) > 0) {
    candidates.push({ key: 'eval_fail', level: 'warn', text: `Eval fail ${o.evalFail || 0}`, domain: 'eval' });
  }
  if (force || (o.flagCanary || 0) > 0) {
    candidates.push({ key: 'canary', level: 'info', text: `Feature canary ${o.flagCanary || 0}`, domain: 'flag' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Oracle heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('orf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('oracle-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ODYSSEUS',
        title: `oracle sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('ors'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('oracle-sweeps', sweep, 80);
  appendAudit({ actor, action: 'oracle.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildOracle() };
}

export function ackOracleFlag(input = {}, actor = 'system') {
  const list = readCollection('oracle-flags', []) || [];
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
  writeCollection('oracle-flags', list);
  appendAudit({ actor, action: 'oracle.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildOracle() };
}

export function resolveOracleAnomaly(input = {}, actor = 'system') {
  const open = listAnomaly().filter((a) => a.status === 'open');
  const resolved = [];
  for (const a of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && a.id !== input.id) continue;
    const next = updateAnomaly(a.id, { status: 'resolved', resolved_by: actor }, actor);
    if (next) resolved.push(next.id);
  }
  if (!resolved.length) {
    const seeded = createAnomaly({ signal: input.signal || 'oracle-resolve-seed', status: 'resolved' }, actor);
    resolved.push(seeded.id);
  }
  appendAudit({ actor, action: 'oracle.anomaly_resolve', detail: `${resolved.length}`, meta: { n: resolved.length } });
  return { ok: true, resolved, overview: buildOracle() };
}

export function clearOracleScoreRed(input = {}, actor = 'system') {
  const reds = listScorecard().filter((s) => s.status === 'red');
  const cleared = [];
  for (const s of reds.slice(0, Number(input.limit) || 20)) {
    if (input.id && s.id !== input.id) continue;
    const next = updateScorecard(s.id, { status: 'green', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createScorecard({ kpi: input.kpi || 'oracle', status: 'green' }, actor);
    cleared.push(seeded.id);
  }
  // eval fail yan temizliği
  if (input.clear_eval) {
    for (const e of listEvalbench().filter((x) => x.status === 'fail').slice(0, 10)) {
      updateEvalbench(e.id, { status: 'pass' }, actor);
    }
  } else if (!listEvalbench().length) {
    createEvalbench({ suite: 'oracle-seed', status: 'pass' }, actor);
  }
  appendAudit({ actor, action: 'oracle.score_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildOracle() };
}

export function promoteOracleCanary(input = {}, actor = 'system') {
  const canaries = listFeatureflag().filter((f) => f.status === 'canary');
  const promoted = [];
  for (const f of canaries.slice(0, Number(input.limit) || 20)) {
    if (input.id && f.id !== input.id) continue;
    const next = updateFeatureflag(f.id, { status: 'on', pct: 100, promoted_by: actor }, actor);
    if (next) promoted.push(next.id);
  }
  if (!promoted.length) {
    const seeded = createFeatureflag({ flag: input.flag || 'oracle_canary', status: 'on', pct: 100 }, actor);
    promoted.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'ODYSSEUS',
      title: `oracle canary promote · ${promoted.length}`,
      priority: 'high',
      payload: { ids: promoted },
    },
    actor,
  );
  appendAudit({ actor, action: 'oracle.canary_promote', detail: `${promoted.length}`, meta: { n: promoted.length } });
  return { ok: true, promoted, overview: buildOracle() };
}
