/**
 * AŞAMA 885 — Monument checkpoint.
 */
import { buildPrism } from './prism.js';
import { createCorrective, listCorrective, correctiveSummary, updateCorrective } from './corrective.js';
import { createOralhistory, listOralhistory, oralhistorySummary, updateOralhistory } from './oralhistory.js';
import { createTimeline, listTimeline, timelineSummary, updateTimeline } from './timeline.js';
import { createBrandbible, listBrandbible, brandbibleSummary, updateBrandbible } from './brandbible.js';
import { createHeritage, listHeritage, heritageSummary, updateHeritage } from './heritage.js';
import { createAlumni, listAlumni, alumniSummary, updateAlumni } from './alumni.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildMonument() {
  const prev = buildPrism();
  const s0 = correctiveSummary();
  const s1 = oralhistorySummary();
  const s2 = timelineSummary();
  const s3 = brandbibleSummary();
  const s4 = heritageSummary();
  const s5 = alumniSummary();
  const flags = readCollection('monument-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Monument',
    prism: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    correctiveSig: s0.open || 0,
    oralhistorySig: s1.draft || 0,
    timelineSig: s2.planned || 0,
    brandbibleSig: s3.idle || 0,
    heritageSig: s4.open || 0,
    alumniSig: s5.draft || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      corrective_open: s0.open || 0,
      oral_draft: s1.draft || 0,
      timeline_planned: s2.planned || 0,
      brand_idle: s3.idle || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Corrective ${s0.open || 0} · Oral History ${s1.draft || 0}`,
      `Timeline ${s2.planned || 0} · Brand Bible ${s3.idle || 0}`,
      `Heritage ${s4.open || 0} · Alumni ${s5.draft || 0}`,
      `Monument flag ${openFlags.length} açık`,
    ],
  };
}

export function runMonumentSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildMonument();
  const existing = readCollection('monument-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.correctiveSig || 0) > 0 || (o.heritageSig || 0) > 0)) {
    candidates.push({ key: 'corrective', level: 'alert', text: `Corrective open ${o.correctiveSig || 0} · Heritage ${o.heritageSig || 0}`, domain: 'corrective' });
  }
  if (force || ((o.oralhistorySig || 0) > 0 || (o.alumniSig || 0) > 0)) {
    candidates.push({ key: 'oral', level: 'warn', text: `Oral draft ${o.oralhistorySig || 0} · Alumni ${o.alumniSig || 0}`, domain: 'oral' });
  }
  if (force || ((o.timelineSig || 0) > 0 || (o.brandbibleSig || 0) > 0)) {
    candidates.push({ key: 'timeline', level: 'info', text: `Timeline planned ${o.timelineSig || 0} · Brand idle ${o.brandbibleSig || 0}`, domain: 'timeline' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Monument heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('monf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('monument-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `monument sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('mons'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('monument-sweeps', sweep, 80);
  appendAudit({ actor, action: 'monument.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildMonument() };
}

export function ackMonumentFlag(input = {}, actor = 'system') {
  const list = readCollection('monument-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('monument-flags', list);
  appendAudit({ actor, action: 'monument.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildMonument() };
}

export function closeMonumentCorrective(input = {}, actor = 'system') {
  const rows = listCorrective().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCorrective(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createCorrective({ action: 'monument', owner: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const h of listHeritage().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateHeritage(h.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'monument.corrective_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildMonument() };
}

export function liveMonumentOral(input = {}, actor = 'system') {
  const rows = listOralhistory().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateOralhistory(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createOralhistory({ speaker: 'monument', topic: 'ok', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const a of listAlumni().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateAlumni(a.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'monument.oral_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildMonument() };
}

export function runMonumentTimeline(input = {}, actor = 'system') {
  const rows = listTimeline().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTimeline(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createTimeline({ event: 'monument', year: '1', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const b of listBrandbible().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateBrandbible(b.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `monument timeline_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'monument.timeline_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildMonument() };
}
