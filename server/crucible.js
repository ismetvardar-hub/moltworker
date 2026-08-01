/**
 * AŞAMA 810 — Crucible checkpoint.
 */
import { buildAgora } from './agora.js';
import { createCohort, listCohort, cohortSummary, updateCohort } from './cohort.js';
import { createPilotrun, listPilotrun, pilotrunSummary, updatePilotrun } from './pilotrun.js';
import { createHypothesis, listHypothesis, hypothesisSummary, updateHypothesis } from './hypothesis.js';
import { createUserboard, listUserboard, userboardSummary, updateUserboard } from './userboard.js';
import { createSandbox, listSandbox, sandboxSummary, updateSandbox } from './sandbox.js';
import { createIncubate, listIncubate, incubateSummary, updateIncubate } from './incubate.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCrucible() {
  const prev = buildAgora();
  const s0 = cohortSummary();
  const s1 = pilotrunSummary();
  const s2 = hypothesisSummary();
  const s3 = userboardSummary();
  const s4 = sandboxSummary();
  const s5 = incubateSummary();
  const flags = readCollection('crucible-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Crucible',
    agora: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    cohortSig: s0.draft || 0,
    pilotrunSig: s1.planned || 0,
    hypothesisSig: s2.idle || 0,
    userboardSig: s3.open || 0,
    sandboxSig: s4.draft || 0,
    incubateSig: s5.planned || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      cohort_draft: s0.draft || 0,
      pilot_planned: s1.planned || 0,
      hypo_idle: s2.idle || 0,
      board_open: s3.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Cohort ${s0.draft || 0} · Pilot Run ${s1.planned || 0}`,
      `Hypothesis ${s2.idle || 0} · User Board ${s3.open || 0}`,
      `Sandbox ${s4.draft || 0} · Incubate ${s5.planned || 0}`,
      `Crucible flag ${openFlags.length} açık`,
    ],
  };
}

export function runCrucibleSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCrucible();
  const existing = readCollection('crucible-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.cohortSig || 0) > 0 || (o.pilotrunSig || 0) > 0)) {
    candidates.push({ key: 'pilot', level: 'alert', text: `Cohort draft ${o.cohortSig || 0} · Pilot ${o.pilotrunSig || 0}`, domain: 'pilot' });
  }
  if (force || ((o.hypothesisSig || 0) > 0 || (o.userboardSig || 0) > 0)) {
    candidates.push({ key: 'learn', level: 'warn', text: `Hypo idle ${o.hypothesisSig || 0} · Board ${o.userboardSig || 0}`, domain: 'learn' });
  }
  if (force || ((o.sandboxSig || 0) > 0 || (o.incubateSig || 0) > 0)) {
    candidates.push({ key: 'lab', level: 'info', text: `Sandbox ${o.sandboxSig || 0} · Incubate ${o.incubateSig || 0}`, domain: 'lab' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Crucible heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('cruf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('crucible-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `crucible sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('crus'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('crucible-sweeps', sweep, 80);
  appendAudit({ actor, action: 'crucible.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCrucible() };
}

export function ackCrucibleFlag(input = {}, actor = 'system') {
  const list = readCollection('crucible-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('crucible-flags', list);
  appendAudit({ actor, action: 'crucible.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCrucible() };
}

export function liveCruciblePilot(input = {}, actor = 'system') {
  const rows = listCohort().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCohort(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCohort({ name: 'crucible', size: 3, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const p of listPilotrun().filter((x) => x.status === 'planned').slice(0, 5)) {
    updatePilotrun(p.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'crucible.pilot_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCrucible() };
}

export function busyCrucibleLearn(input = {}, actor = 'system') {
  const rows = listHypothesis().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHypothesis(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createHypothesis({ title: 'crucible', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const u of listUserboard().filter((x) => x.status === 'open').slice(0, 5)) {
    updateUserboard(u.id, { status: 'active', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'crucible.learn_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildCrucible() };
}

export function shipCrucibleLab(input = {}, actor = 'system') {
  const rows = listSandbox().filter((x) => x.status === 'draft');
  const shipped = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSandbox(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) shipped.push(next.id);
  }
  if (!shipped.length) {
    const seeded = createSandbox({ name: 'crucible', status: 'live' }, actor);
    shipped.push(seeded.id);
  }
  for (const i of listIncubate().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateIncubate(i.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `crucible lab_ship · ${shipped.length}`, priority: 'normal', payload: { ids: shipped } }, actor);
  appendAudit({ actor, action: 'crucible.lab_ship', detail: `${shipped.length}`, meta: { n: shipped.length } });
  return { ok: true, shipped, overview: buildCrucible() };
}
