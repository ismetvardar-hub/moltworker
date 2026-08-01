/**
 * AŞAMA 360 — Mirror checkpoint.
 */
import { buildLattice } from './lattice.js';
import { createGuesttwin, listGuesttwin, guesttwinSummary, updateGuesttwin } from './guesttwin.js';
import { createIntentscore, listIntentscore, intentscoreSummary, updateIntentscore } from './intentscore.js';
import { createNextbest, listNextbest, nextbestSummary, updateNextbest } from './nextbest.js';
import { createChurnrisk, listChurnrisk, churnriskSummary, updateChurnrisk } from './churnrisk.js';
import { createEmotionpulse, listEmotionpulse, emotionpulseSummary, updateEmotionpulse } from './emotionpulse.js';
import { createRecoverypath, listRecoverypath, recoverypathSummary, updateRecoverypath } from './recoverypath.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildMirror() {
  const prev = buildLattice();
  const twin = guesttwinSummary();
  const intent = intentscoreSummary();
  const nba = nextbestSummary();
  const churn = churnriskSummary();
  const emo = emotionpulseSummary();
  const rec = recoverypathSummary();
  const flags = readCollection('mirror-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Mirror',
    lattice: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    twinsStale: twin.stale || 0,
    intentHigh: intent.high || 0,
    nbaSuggested: nba.suggested || 0,
    churnHigh: churn.high || 0,
    emotionAlert: emo.alert || 0,
    recoveryOpen: rec.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      twin_stale: twin.stale || 0,
      intent_high: intent.high || 0,
      nba_suggested: nba.suggested || 0,
      churn_high: churn.high || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Guest twin stale ${twin.stale || 0} · Intent high ${intent.high || 0}`,
      `NBA suggested ${nba.suggested || 0} · Churn high ${churn.high || 0}`,
      `Emotion alert ${emo.alert || 0} · Recovery open ${rec.open || 0}`,
      `Mirror flag ${openFlags.length} açık`,
    ],
  };
}

export function runMirrorSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildMirror();
  const existing = readCollection('mirror-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.twinsStale || 0) > 0 || (o.emotionAlert || 0) > 0)) {
    candidates.push({ key: 'twin', level: 'alert', text: `Twin stale ${o.twinsStale || 0} · Emotion ${o.emotionAlert || 0}`, domain: 'twin' });
  }
  if (force || ((o.intentHigh || 0) > 0 || (o.nbaSuggested || 0) > 0)) {
    candidates.push({ key: 'nba', level: 'warn', text: `Intent high ${o.intentHigh || 0} · NBA ${o.nbaSuggested || 0}`, domain: 'nba' });
  }
  if (force || ((o.churnHigh || 0) > 0 || (o.recoveryOpen || 0) > 0)) {
    candidates.push({ key: 'recovery', level: 'info', text: `Churn high ${o.churnHigh || 0} · Recovery ${o.recoveryOpen || 0}`, domain: 'recovery' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Mirror heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('mirf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('mirror-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `mirror sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('mirs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('mirror-sweeps', sweep, 80);
  appendAudit({ actor, action: 'mirror.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildMirror() };
}

export function ackMirrorFlag(input = {}, actor = 'system') {
  const list = readCollection('mirror-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('mirror-flags', list);
  appendAudit({ actor, action: 'mirror.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildMirror() };
}

export function refreshMirrorTwin(input = {}, actor = 'system') {
  const rows = listGuesttwin().filter((x) => x.status === 'stale' || x.status === 'archived');
  const refreshed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateGuesttwin(row.id, { status: 'active', touched_by: actor }, actor);
    if (next) refreshed.push(next.id);
  }
  if (!refreshed.length) {
    const seeded = createGuesttwin({ guestName: 'mirror', persona: 'ok', status: 'active' }, actor);
    refreshed.push(seeded.id);
  }
  for (const e of listEmotionpulse().filter((x) => x.status === 'alert' || x.status === 'mixed').slice(0, 5)) {
    updateEmotionpulse(e.id, { status: 'calm', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'mirror.twin_refresh', detail: `${refreshed.length}`, meta: { n: refreshed.length } });
  return { ok: true, refreshed, overview: buildMirror() };
}

export function acceptMirrorNba(input = {}, actor = 'system') {
  const rows = listNextbest().filter((x) => x.status === 'suggested');
  const accepted = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNextbest(row.id, { status: 'accepted', touched_by: actor }, actor);
    if (next) accepted.push(next.id);
  }
  if (!accepted.length) {
    const seeded = createNextbest({ guestName: 'mirror', action: 'ok', status: 'accepted' }, actor);
    accepted.push(seeded.id);
  }
  for (const i of listIntentscore().filter((x) => x.status === 'high' || x.status === 'medium').slice(0, 5)) {
    updateIntentscore(i.id, { status: 'low', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'mirror.nba_accept', detail: `${accepted.length}`, meta: { n: accepted.length } });
  return { ok: true, accepted, overview: buildMirror() };
}

export function closeMirrorRecovery(input = {}, actor = 'system') {
  const rows = listRecoverypath().filter((x) => x.status === 'open' || x.status === 'running');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRecoverypath(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createRecoverypath({ caseId: 'mirror', path: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const c of listChurnrisk().filter((x) => x.status === 'high' || x.status === 'medium').slice(0, 5)) {
    updateChurnrisk(c.id, { status: 'low', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `mirror recovery_close · ${closed.length}`, priority: 'normal', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'mirror.recovery_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildMirror() };
}
