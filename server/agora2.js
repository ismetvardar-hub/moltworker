/**
 * AŞAMA 1005 — Agora2 checkpoint.
 */
import { buildCircuit2 } from './circuit2.js';
import { createChaosdrill2, listChaosdrill2, chaosdrill2Summary, updateChaosdrill2 } from './chaosdrill2.js';
import { createCircle2, listCircle2, circle2Summary, updateCircle2 } from './circle2.js';
import { createForummod2, listForummod2, forummod2Summary, updateForummod2 } from './forummod2.js';
import { createBadgeearn2, listBadgeearn2, badgeearn2Summary, updateBadgeearn2 } from './badgeearn2.js';
import { createVolunteer2, listVolunteer2, volunteer2Summary, updateVolunteer2 } from './volunteer2.js';
import { createChapter2, listChapter2, chapter2Summary, updateChapter2 } from './chapter2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildAgora2() {
  const prev = buildCircuit2();
  const s0 = chaosdrill2Summary();
  const s1 = circle2Summary();
  const s2 = forummod2Summary();
  const s3 = badgeearn2Summary();
  const s4 = volunteer2Summary();
  const s5 = chapter2Summary();
  const flags = readCollection('agora2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Agora2',
    circuit2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    chaosdrill2Sig: s0.planned || 0,
    circle2Sig: s1.idle || 0,
    forummod2Sig: s2.open || 0,
    badgeearn2Sig: s3.draft || 0,
    volunteer2Sig: s4.planned || 0,
    chapter2Sig: s5.idle || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      chaos_planned: s0.planned || 0,
      circle_idle: s1.idle || 0,
      forum_open: s2.open || 0,
      badge_draft: s3.draft || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Chaos Drill ${s0.planned || 0} · Circle ${s1.idle || 0}`,
      `Forum Mod ${s2.open || 0} · Badge Earn ${s3.draft || 0}`,
      `Volunteer ${s4.planned || 0} · Chapter ${s5.idle || 0}`,
      `Agora2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runAgora2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAgora2();
  const existing = readCollection('agora2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.chaosdrill2Sig || 0) > 0 || (o.volunteer2Sig || 0) > 0)) {
    candidates.push({ key: 'drill', level: 'alert', text: `Chaos planned ${o.chaosdrill2Sig || 0} · Volunteer ${o.volunteer2Sig || 0}`, domain: 'drill' });
  }
  if (force || ((o.circle2Sig || 0) > 0 || (o.chapter2Sig || 0) > 0)) {
    candidates.push({ key: 'circle', level: 'warn', text: `Circle idle ${o.circle2Sig || 0} · Chapter ${o.chapter2Sig || 0}`, domain: 'circle' });
  }
  if (force || ((o.forummod2Sig || 0) > 0 || (o.badgeearn2Sig || 0) > 0)) {
    candidates.push({ key: 'forum', level: 'info', text: `Forum open ${o.forummod2Sig || 0} · Badge draft ${o.badgeearn2Sig || 0}`, domain: 'forum' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Agora2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ag2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('agora2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `agora2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ag2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('agora2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'agora2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAgora2() };
}

export function ackAgora2Flag(input = {}, actor = 'system') {
  const list = readCollection('agora2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('agora2-flags', list);
  appendAudit({ actor, action: 'agora2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAgora2() };
}

export function runAgora2Drill(input = {}, actor = 'system') {
  const rows = listChaosdrill2().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChaosdrill2(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createChaosdrill2({ target: 'agora2', score: 5, status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const v of listVolunteer2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateVolunteer2(v.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'agora2.drill_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildAgora2() };
}

export function busyAgora2Circle(input = {}, actor = 'system') {
  const rows = listCircle2().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCircle2(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createCircle2({ circle: 'agora2', members: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listChapter2().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateChapter2(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'agora2.circle_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildAgora2() };
}

export function liveAgora2Badge(input = {}, actor = 'system') {
  const rows = listBadgeearn2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBadgeearn2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createBadgeearn2({ member: 'agora2', badge: 'live', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const f of listForummod2().filter((x) => x.status === 'open').slice(0, 5)) {
    updateForummod2(f.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `agora2 badge_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'agora2.badge_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildAgora2() };
}
