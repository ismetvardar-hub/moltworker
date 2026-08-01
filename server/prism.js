/**
 * AŞAMA 870 — Prism checkpoint.
 */
import { buildFrontier } from './frontier.js';
import { createPostlaunch, listPostlaunch, postlaunchSummary, updatePostlaunch } from './postlaunch.js';
import { createDefectlog, listDefectlog, defectlogSummary, updateDefectlog } from './defectlog.js';
import { createMysteryguest, listMysteryguest, mysteryguestSummary, updateMysteryguest } from './mysteryguest.js';
import { createServicemark, listServicemark, servicemarkSummary, updateServicemark } from './servicemark.js';
import { createLabresult, listLabresult, labresultSummary, updateLabresult } from './labresult.js';
import { createIsotrack, listIsotrack, isotrackSummary, updateIsotrack } from './isotrack.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildPrism() {
  const prev = buildFrontier();
  const s0 = postlaunchSummary();
  const s1 = defectlogSummary();
  const s2 = mysteryguestSummary();
  const s3 = servicemarkSummary();
  const s4 = labresultSummary();
  const s5 = isotrackSummary();
  const flags = readCollection('prism-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Prism',
    frontier: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    postlaunchSig: s0.draft || 0,
    defectlogSig: s1.planned || 0,
    mysteryguestSig: s2.idle || 0,
    servicemarkSig: s3.open || 0,
    labresultSig: s4.draft || 0,
    isotrackSig: s5.planned || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      post_draft: s0.draft || 0,
      defect_planned: s1.planned || 0,
      mystery_idle: s2.idle || 0,
      mark_open: s3.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Post Launch ${s0.draft || 0} · Defect Log ${s1.planned || 0}`,
      `Mystery Guest ${s2.idle || 0} · Service Mark ${s3.open || 0}`,
      `Lab Result ${s4.draft || 0} · ISO Track ${s5.planned || 0}`,
      `Prism flag ${openFlags.length} açık`,
    ],
  };
}

export function runPrismSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildPrism();
  const existing = readCollection('prism-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.servicemarkSig || 0) > 0)) {
    candidates.push({ key: 'mark', level: 'alert', text: `Service mark open ${o.servicemarkSig || 0}`, domain: 'mark' });
  }
  if (force || ((o.postlaunchSig || 0) > 0 || (o.labresultSig || 0) > 0)) {
    candidates.push({ key: 'post', level: 'warn', text: `Post draft ${o.postlaunchSig || 0} · Lab ${o.labresultSig || 0}`, domain: 'post' });
  }
  if (force || ((o.defectlogSig || 0) > 0 || (o.mysteryguestSig || 0) > 0 || (o.isotrackSig || 0) > 0)) {
    candidates.push({ key: 'defect', level: 'info', text: `Defect planned ${o.defectlogSig || 0} · Mystery idle ${o.mysteryguestSig || 0}`, domain: 'defect' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Prism heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('prif'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('prism-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `prism sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('pris'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('prism-sweeps', sweep, 80);
  appendAudit({ actor, action: 'prism.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildPrism() };
}

export function ackPrismFlag(input = {}, actor = 'system') {
  const list = readCollection('prism-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('prism-flags', list);
  appendAudit({ actor, action: 'prism.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildPrism() };
}

export function closePrismMark(input = {}, actor = 'system') {
  const rows = listServicemark().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateServicemark(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createServicemark({ mark: 'prism', score: '1', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'prism.mark_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPrism() };
}

export function livePrismPost(input = {}, actor = 'system') {
  const rows = listPostlaunch().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePostlaunch(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createPostlaunch({ site: 'prism', score: '1', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const l of listLabresult().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateLabresult(l.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'prism.post_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildPrism() };
}

export function runPrismDefect(input = {}, actor = 'system') {
  const rows = listDefectlog().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDefectlog(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createDefectlog({ sku: 'prism', defect: 'ok', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const i of listIsotrack().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateIsotrack(i.id, { status: 'doing', touched_by: actor }, actor);
  }
  for (const m of listMysteryguest().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateMysteryguest(m.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `prism defect_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'prism.defect_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildPrism() };
}
