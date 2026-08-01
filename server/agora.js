/**
 * AŞAMA 795 — Agora checkpoint.
 */
import { buildCircuit } from './circuit.js';
import { createChaosdrill, listChaosdrill, chaosdrillSummary, updateChaosdrill } from './chaosdrill.js';
import { createCircle, listCircle, circleSummary, updateCircle } from './circle.js';
import { createForummod, listForummod, forummodSummary, updateForummod } from './forummod.js';
import { createBadgeearn, listBadgeearn, badgeearnSummary, updateBadgeearn } from './badgeearn.js';
import { createVolunteer, listVolunteer, volunteerSummary, updateVolunteer } from './volunteer.js';
import { createChapter, listChapter, chapterSummary, updateChapter } from './chapter.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildAgora() {
  const prev = buildCircuit();
  const s0 = chaosdrillSummary();
  const s1 = circleSummary();
  const s2 = forummodSummary();
  const s3 = badgeearnSummary();
  const s4 = volunteerSummary();
  const s5 = chapterSummary();
  const flags = readCollection('agora-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Agora',
    circuit: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    chaosdrillSig: s0.planned || 0,
    circleSig: s1.idle || 0,
    forummodSig: s2.open || 0,
    badgeearnSig: s3.draft || 0,
    volunteerSig: s4.planned || 0,
    chapterSig: s5.idle || 0,
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
      `Agora flag ${openFlags.length} açık`,
    ],
  };
}

export function runAgoraSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAgora();
  const existing = readCollection('agora-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.chaosdrillSig || 0) > 0 || (o.volunteerSig || 0) > 0)) {
    candidates.push({ key: 'drill', level: 'alert', text: `Chaos planned ${o.chaosdrillSig || 0} · Volunteer ${o.volunteerSig || 0}`, domain: 'drill' });
  }
  if (force || ((o.circleSig || 0) > 0 || (o.chapterSig || 0) > 0)) {
    candidates.push({ key: 'circle', level: 'warn', text: `Circle idle ${o.circleSig || 0} · Chapter ${o.chapterSig || 0}`, domain: 'circle' });
  }
  if (force || ((o.forummodSig || 0) > 0 || (o.badgeearnSig || 0) > 0)) {
    candidates.push({ key: 'forum', level: 'info', text: `Forum open ${o.forummodSig || 0} · Badge draft ${o.badgeearnSig || 0}`, domain: 'forum' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Agora heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('agf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('agora-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `agora sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ags'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('agora-sweeps', sweep, 80);
  appendAudit({ actor, action: 'agora.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAgora() };
}

export function ackAgoraFlag(input = {}, actor = 'system') {
  const list = readCollection('agora-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('agora-flags', list);
  appendAudit({ actor, action: 'agora.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAgora() };
}

export function runAgoraDrill(input = {}, actor = 'system') {
  const rows = listChaosdrill().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChaosdrill(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createChaosdrill({ target: 'agora', score: 5, status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const v of listVolunteer().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateVolunteer(v.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'agora.drill_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildAgora() };
}

export function busyAgoraCircle(input = {}, actor = 'system') {
  const rows = listCircle().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCircle(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createCircle({ circle: 'agora', members: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listChapter().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateChapter(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'agora.circle_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildAgora() };
}

export function liveAgoraBadge(input = {}, actor = 'system') {
  const rows = listBadgeearn().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBadgeearn(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createBadgeearn({ member: 'agora', badge: 'live', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const f of listForummod().filter((x) => x.status === 'open').slice(0, 5)) {
    updateForummod(f.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `agora badge_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'agora.badge_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildAgora() };
}
