/**
 * AŞAMA 1170 — Logos checkpoint.
 */
import { buildKairos } from './kairos.js';
import { createCohort3, listCohort3, cohort3Summary, updateCohort3 } from './cohort3.js';
import { createPilotrun3, listPilotrun3, pilotrun3Summary, updatePilotrun3 } from './pilotrun3.js';
import { createHypothesis3, listHypothesis3, hypothesis3Summary, updateHypothesis3 } from './hypothesis3.js';
import { createUserboard3, listUserboard3, userboard3Summary, updateUserboard3 } from './userboard3.js';
import { createSandbox3, listSandbox3, sandbox3Summary, updateSandbox3 } from './sandbox3.js';
import { createIncubate3, listIncubate3, incubate3Summary, updateIncubate3 } from './incubate3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildLogos() {
  const prev = buildKairos();
  const s0 = cohort3Summary();
  const s1 = pilotrun3Summary();
  const s2 = hypothesis3Summary();
  const s3 = userboard3Summary();
  const s4 = sandbox3Summary();
  const s5 = incubate3Summary();
  const flags = readCollection('logos-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Logos',
    kairos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    cohort3Sig: s0.draft || 0,
    pilotrun3Sig: s1.planned || 0,
    hypothesis3Sig: s2.idle || 0,
    userboard3Sig: s3.open || 0,
    sandbox3Sig: s4.draft || 0,
    incubate3Sig: s5.planned || 0,
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
      `Logos flag ${openFlags.length} açık`,
    ],
  };
}

export function runLogosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildLogos();
  const existing = readCollection('logos-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.cohort3Sig || 0) > 0 || (o.pilotrun3Sig || 0) > 0)) {
    candidates.push({ key: 'pilot', level: 'alert', text: `Cohort draft ${o.cohort3Sig || 0} · Pilot ${o.pilotrun3Sig || 0}`, domain: 'pilot' });
  }
  if (force || ((o.hypothesis3Sig || 0) > 0 || (o.userboard3Sig || 0) > 0)) {
    candidates.push({ key: 'learn', level: 'warn', text: `Hypo idle ${o.hypothesis3Sig || 0} · Board ${o.userboard3Sig || 0}`, domain: 'learn' });
  }
  if (force || ((o.sandbox3Sig || 0) > 0 || (o.incubate3Sig || 0) > 0)) {
    candidates.push({ key: 'lab', level: 'info', text: `Sandbox ${o.sandbox3Sig || 0} · Incubate ${o.incubate3Sig || 0}`, domain: 'lab' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Logos heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('logf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('logos-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `logos sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('logs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('logos-sweeps', sweep, 80);
  appendAudit({ actor, action: 'logos.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildLogos() };
}

export function ackLogosFlag(input = {}, actor = 'system') {
  const list = readCollection('logos-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('logos-flags', list);
  appendAudit({ actor, action: 'logos.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildLogos() };
}

export function liveLogosPilot(input = {}, actor = 'system') {
  const rows = listCohort3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCohort3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCohort3({ name: 'logos', size: 3, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const p of listPilotrun3().filter((x) => x.status === 'planned').slice(0, 5)) {
    updatePilotrun3(p.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'logos.pilot_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildLogos() };
}

export function busyLogosLearn(input = {}, actor = 'system') {
  const rows = listHypothesis3().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHypothesis3(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createHypothesis3({ claim: 'logos', confidence: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const u of listUserboard3().filter((x) => x.status === 'open').slice(0, 5)) {
    updateUserboard3(u.id, { status: 'active', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'logos.learn_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildLogos() };
}

export function shipLogosLab(input = {}, actor = 'system') {
  const rows = listSandbox3().filter((x) => x.status === 'draft');
  const shipped = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSandbox3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) shipped.push(next.id);
  }
  if (!shipped.length) {
    const seeded = createSandbox3({ env: 'logos', owner: 'ops', status: 'live' }, actor);
    shipped.push(seeded.id);
  }
  for (const i of listIncubate3().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateIncubate3(i.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `logos lab_ship · ${shipped.length}`, priority: 'normal', payload: { ids: shipped } }, actor);
  appendAudit({ actor, action: 'logos.lab_ship', detail: `${shipped.length}`, meta: { n: shipped.length } });
  return { ok: true, shipped, overview: buildLogos() };
}
