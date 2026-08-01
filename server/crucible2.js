/**
 * AŞAMA 1020 — Crucible2 checkpoint.
 */
import { buildAgora2 } from './agora2.js';
import { createCohort2, listCohort2, cohort2Summary, updateCohort2 } from './cohort2.js';
import { createPilotrun2, listPilotrun2, pilotrun2Summary, updatePilotrun2 } from './pilotrun2.js';
import { createHypothesis2, listHypothesis2, hypothesis2Summary, updateHypothesis2 } from './hypothesis2.js';
import { createUserboard2, listUserboard2, userboard2Summary, updateUserboard2 } from './userboard2.js';
import { createSandbox2, listSandbox2, sandbox2Summary, updateSandbox2 } from './sandbox2.js';
import { createIncubate2, listIncubate2, incubate2Summary, updateIncubate2 } from './incubate2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCrucible2() {
  const prev = buildAgora2();
  const s0 = cohort2Summary();
  const s1 = pilotrun2Summary();
  const s2 = hypothesis2Summary();
  const s3 = userboard2Summary();
  const s4 = sandbox2Summary();
  const s5 = incubate2Summary();
  const flags = readCollection('crucible2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Crucible2',
    agora2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    cohort2Sig: s0.draft || 0,
    pilotrun2Sig: s1.planned || 0,
    hypothesis2Sig: s2.idle || 0,
    userboard2Sig: s3.open || 0,
    sandbox2Sig: s4.draft || 0,
    incubate2Sig: s5.planned || 0,
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
      `Crucible2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runCrucible2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCrucible2();
  const existing = readCollection('crucible2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.cohort2Sig || 0) > 0 || (o.pilotrun2Sig || 0) > 0)) {
    candidates.push({ key: 'pilot', level: 'alert', text: `Cohort draft ${o.cohort2Sig || 0} · Pilot ${o.pilotrun2Sig || 0}`, domain: 'pilot' });
  }
  if (force || ((o.hypothesis2Sig || 0) > 0 || (o.userboard2Sig || 0) > 0)) {
    candidates.push({ key: 'learn', level: 'warn', text: `Hypo idle ${o.hypothesis2Sig || 0} · Board ${o.userboard2Sig || 0}`, domain: 'learn' });
  }
  if (force || ((o.sandbox2Sig || 0) > 0 || (o.incubate2Sig || 0) > 0)) {
    candidates.push({ key: 'lab', level: 'info', text: `Sandbox ${o.sandbox2Sig || 0} · Incubate ${o.incubate2Sig || 0}`, domain: 'lab' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Crucible2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('c2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('crucible2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `crucible2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('c2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('crucible2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'crucible2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCrucible2() };
}

export function ackCrucible2Flag(input = {}, actor = 'system') {
  const list = readCollection('crucible2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('crucible2-flags', list);
  appendAudit({ actor, action: 'crucible2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCrucible2() };
}

export function liveCrucible2Pilot(input = {}, actor = 'system') {
  const rows = listCohort2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCohort2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCohort2({ name: 'crucible', size: 3, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const p of listPilotrun2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updatePilotrun2(p.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'crucible2.pilot_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCrucible2() };
}

export function busyCrucible2Learn(input = {}, actor = 'system') {
  const rows = listHypothesis2().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHypothesis2(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createHypothesis2({ title: 'crucible', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const u of listUserboard2().filter((x) => x.status === 'open').slice(0, 5)) {
    updateUserboard2(u.id, { status: 'active', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'crucible2.learn_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildCrucible2() };
}

export function shipCrucible2Lab(input = {}, actor = 'system') {
  const rows = listSandbox2().filter((x) => x.status === 'draft');
  const shipped = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSandbox2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) shipped.push(next.id);
  }
  if (!shipped.length) {
    const seeded = createSandbox2({ name: 'crucible', status: 'live' }, actor);
    shipped.push(seeded.id);
  }
  for (const i of listIncubate2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateIncubate2(i.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `crucible2 lab_ship · ${shipped.length}`, priority: 'normal', payload: { ids: shipped } }, actor);
  appendAudit({ actor, action: 'crucible2.lab_ship', detail: `${shipped.length}`, meta: { n: shipped.length } });
  return { ok: true, shipped, overview: buildCrucible2() };
}
