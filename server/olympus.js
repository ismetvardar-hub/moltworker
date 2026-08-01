/**
 * AŞAMA 900 — Olympus checkpoint.
 */
import { buildMonument } from './monument.js';
import { createStoryvault, listStoryvault, storyvaultSummary, updateStoryvault } from './storyvault.js';
import { createHoldingseal, listHoldingseal, holdingsealSummary, updateHoldingseal } from './holdingseal.js';
import { createFinalbrief, listFinalbrief, finalbriefSummary, updateFinalbrief } from './finalbrief.js';
import { createEternallog, listEternallog, eternallogSummary, updateEternallog } from './eternallog.js';
import { createConstellate, listConstellate, constellateSummary, updateConstellate } from './constellate.js';
import { createAegisfinal, listAegisfinal, aegisfinalSummary, updateAegisfinal } from './aegisfinal.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildOlympus() {
  const prev = buildMonument();
  const s0 = storyvaultSummary();
  const s1 = holdingsealSummary();
  const s2 = finalbriefSummary();
  const s3 = eternallogSummary();
  const s4 = constellateSummary();
  const s5 = aegisfinalSummary();
  const flags = readCollection('olympus-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Olympus',
    monument: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    storyvaultSig: s0.idle || 0,
    holdingsealSig: s1.open || 0,
    finalbriefSig: s2.draft || 0,
    eternallogSig: s3.planned || 0,
    constellateSig: s4.idle || 0,
    aegisfinalSig: s5.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      story_idle: s0.idle || 0,
      seal_open: s1.open || 0,
      brief_draft: s2.draft || 0,
      log_planned: s3.planned || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Story Vault ${s0.idle || 0} · Holding Seal ${s1.open || 0}`,
      `Final Brief ${s2.draft || 0} · Eternal Log ${s3.planned || 0}`,
      `Constellate ${s4.idle || 0} · Aegis Final ${s5.open || 0}`,
      `Olympus flag ${openFlags.length} açık`,
    ],
  };
}

export function runOlympusSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildOlympus();
  const existing = readCollection('olympus-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.holdingsealSig || 0) > 0 || (o.aegisfinalSig || 0) > 0)) {
    candidates.push({ key: 'seal', level: 'alert', text: `Seal open ${o.holdingsealSig || 0} · Aegis ${o.aegisfinalSig || 0}`, domain: 'seal' });
  }
  if (force || ((o.finalbriefSig || 0) > 0 || (o.eternallogSig || 0) > 0)) {
    candidates.push({ key: 'brief', level: 'warn', text: `Brief draft ${o.finalbriefSig || 0} · Log ${o.eternallogSig || 0}`, domain: 'brief' });
  }
  if (force || ((o.storyvaultSig || 0) > 0 || (o.constellateSig || 0) > 0)) {
    candidates.push({ key: 'story', level: 'info', text: `Story idle ${o.storyvaultSig || 0} · Constellate ${o.constellateSig || 0}`, domain: 'story' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Olympus heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('olyf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('olympus-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `olympus sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('olys'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('olympus-sweeps', sweep, 80);
  appendAudit({ actor, action: 'olympus.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildOlympus() };
}

export function ackOlympusFlag(input = {}, actor = 'system') {
  const list = readCollection('olympus-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('olympus-flags', list);
  appendAudit({ actor, action: 'olympus.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildOlympus() };
}

export function closeOlympusSeal(input = {}, actor = 'system') {
  const rows = listHoldingseal().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHoldingseal(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createHoldingseal({ seal: 'olympus', version: '1', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const a of listAegisfinal().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateAegisfinal(a.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'olympus.seal_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildOlympus() };
}

export function liveOlympusBrief(input = {}, actor = 'system') {
  const rows = listFinalbrief().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateFinalbrief(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createFinalbrief({ topic: 'olympus', owner: 'ok', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const e of listEternallog().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateEternallog(e.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'olympus.brief_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildOlympus() };
}

export function busyOlympusStory(input = {}, actor = 'system') {
  const rows = listStoryvault().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateStoryvault(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createStoryvault({ story: 'olympus', era: 'ok', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listConstellate().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateConstellate(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `olympus story_busy · ${busied.length}`, priority: 'normal', payload: { ids: busied } }, actor);
  appendAudit({ actor, action: 'olympus.story_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildOlympus() };
}
