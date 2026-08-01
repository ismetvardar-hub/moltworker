/**
 * AŞAMA 1155 — Kairos checkpoint.
 */
import { buildChronos } from './chronos.js';
import { createChaosdrill3, listChaosdrill3, chaosdrill3Summary, updateChaosdrill3 } from './chaosdrill3.js';
import { createCircle3, listCircle3, circle3Summary, updateCircle3 } from './circle3.js';
import { createForummod3, listForummod3, forummod3Summary, updateForummod3 } from './forummod3.js';
import { createBadgeearn3, listBadgeearn3, badgeearn3Summary, updateBadgeearn3 } from './badgeearn3.js';
import { createVolunteer3, listVolunteer3, volunteer3Summary, updateVolunteer3 } from './volunteer3.js';
import { createChapter3, listChapter3, chapter3Summary, updateChapter3 } from './chapter3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildKairos() {
  const prev = buildChronos();
  const s0 = chaosdrill3Summary();
  const s1 = circle3Summary();
  const s2 = forummod3Summary();
  const s3 = badgeearn3Summary();
  const s4 = volunteer3Summary();
  const s5 = chapter3Summary();
  const flags = readCollection('kairos-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Kairos',
    chronos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    chaosdrill3Sig: s0.planned || 0,
    circle3Sig: s1.idle || 0,
    forummod3Sig: s2.open || 0,
    badgeearn3Sig: s3.draft || 0,
    volunteer3Sig: s4.planned || 0,
    chapter3Sig: s5.idle || 0,
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
      `Kairos flag ${openFlags.length} açık`,
    ],
  };
}

export function runKairosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildKairos();
  const existing = readCollection('kairos-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.chaosdrill3Sig || 0) > 0 || (o.volunteer3Sig || 0) > 0)) {
    candidates.push({ key: 'drill', level: 'alert', text: `Chaos planned ${o.chaosdrill3Sig || 0} · Volunteer ${o.volunteer3Sig || 0}`, domain: 'drill' });
  }
  if (force || ((o.circle3Sig || 0) > 0 || (o.chapter3Sig || 0) > 0)) {
    candidates.push({ key: 'circle', level: 'warn', text: `Circle idle ${o.circle3Sig || 0} · Chapter ${o.chapter3Sig || 0}`, domain: 'circle' });
  }
  if (force || ((o.forummod3Sig || 0) > 0 || (o.badgeearn3Sig || 0) > 0)) {
    candidates.push({ key: 'forum', level: 'info', text: `Forum open ${o.forummod3Sig || 0} · Badge draft ${o.badgeearn3Sig || 0}`, domain: 'forum' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Kairos heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('kaf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('kairos-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `kairos sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('kas'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('kairos-sweeps', sweep, 80);
  appendAudit({ actor, action: 'kairos.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildKairos() };
}

export function ackKairosFlag(input = {}, actor = 'system') {
  const list = readCollection('kairos-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('kairos-flags', list);
  appendAudit({ actor, action: 'kairos.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildKairos() };
}

export function runKairosDrill(input = {}, actor = 'system') {
  const rows = listChaosdrill3().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChaosdrill3(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createChaosdrill3({ target: 'kairos', score: 5, status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const v of listVolunteer3().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateVolunteer3(v.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'kairos.drill_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildKairos() };
}

export function busyKairosCircle(input = {}, actor = 'system') {
  const rows = listCircle3().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCircle3(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createCircle3({ circle: 'kairos', members: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listChapter3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateChapter3(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'kairos.circle_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildKairos() };
}

export function liveKairosBadge(input = {}, actor = 'system') {
  const rows = listBadgeearn3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBadgeearn3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createBadgeearn3({ member: 'kairos', badge: 'live', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const f of listForummod3().filter((x) => x.status === 'open').slice(0, 5)) {
    updateForummod3(f.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `kairos badge_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'kairos.badge_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildKairos() };
}
