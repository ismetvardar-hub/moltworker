/**
 * AŞAMA 675 — Studio checkpoint.
 */
import { buildBazaar } from './bazaar.js';
import { createMediawall, listMediawall, mediawallSummary, updateMediawall } from './mediawall.js';
import { createLivecast, listLivecast, livecastSummary, updateLivecast } from './livecast.js';
import { createUgcmod, listUgcmod, ugcmodSummary, updateUgcmod } from './ugcmod.js';
import { createSponsorpack, listSponsorpack, sponsorpackSummary, updateSponsorpack } from './sponsorpack.js';
import { createBoostdesk, listBoostdesk, boostdeskSummary, updateBoostdesk } from './boostdesk.js';
import { createBriefdesk, listBriefdesk, briefdeskSummary, updateBriefdesk } from './briefdesk.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildStudio() {
  const prev = buildBazaar();
  const wall = mediawallSummary();
  const live = livecastSummary();
  const ugc = ugcmodSummary();
  const spon = sponsorpackSummary();
  const boost = boostdeskSummary();
  const brief = briefdeskSummary();
  const flags = readCollection('studio-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Studio',
    bazaar: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    wallPlaying: wall.playing || 0,
    liveOn: live.live || 0,
    ugcQueued: ugc.queued || 0,
    sponLive: spon.live || 0,
    boostRunning: boost.running || 0,
    briefProd: brief.in_prod || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      ugc_queued: ugc.queued || 0,
      live_on: live.live || 0,
      boost_running: boost.running || 0,
      brief_prod: brief.in_prod || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Media wall playing ${wall.playing || 0} · Live casts ${live.live || 0}`,
      `UGC queued ${ugc.queued || 0} · Sponsors live ${spon.live || 0}`,
      `Boost running ${boost.running || 0} · Briefs in prod ${brief.in_prod || 0}`,
      `Studio flag ${openFlags.length} açık`,
    ],
  };
}

export function runStudioSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildStudio();
  const existing = readCollection('studio-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.ugcQueued || 0) > 0)) {
    candidates.push({ key: 'ugc_q', level: 'warn', text: `UGC queued ${o.ugcQueued || 0}`, domain: 'ugc' });
  }
  if (force || ((o.liveOn || 0) > 0)) {
    candidates.push({ key: 'live_on', level: 'info', text: `Live casts ${o.liveOn || 0}`, domain: 'live' });
  }
  if (force || ((o.briefProd || 0) > 0 || (o.boostRunning || 0) > 0)) {
    candidates.push({ key: 'prod_boost', level: 'info', text: `Brief prod ${o.briefProd || 0} · Boost ${o.boostRunning || 0}`, domain: 'prod' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Studio heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('stf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('studio-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'KALYPSO', title: `studio sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('sts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('studio-sweeps', sweep, 80);
  appendAudit({ actor, action: 'studio.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildStudio() };
}

export function ackStudioFlag(input = {}, actor = 'system') {
  const list = readCollection('studio-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('studio-flags', list);
  appendAudit({ actor, action: 'studio.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildStudio() };
}

export function approveStudioUgc(input = {}, actor = 'system') {
  const rows = listUgcmod().filter((x) => x.status === 'queued');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateUgcmod(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createUgcmod({ author: 'studio', platform: 'IG', status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  appendAudit({ actor, action: 'studio.ugc_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildStudio() };
}

export function endStudioLive(input = {}, actor = 'system') {
  const rows = listLivecast().filter((x) => x.status === 'live' || x.status === 'scheduled');
  const ended = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLivecast(row.id, { status: 'ended', touched_by: actor }, actor);
    if (next) ended.push(next.id);
  }
  if (!ended.length) {
    const seeded = createLivecast({ show: 'studio', platform: 'YT', status: 'ended' }, actor);
    ended.push(seeded.id);
  }
  for (const w of listMediawall().filter((x) => x.status === 'playing' || x.status === 'queued').slice(0, 5)) { updateMediawall(w.id, { status: 'done', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'studio.live_end', detail: `${ended.length}`, meta: { n: ended.length } });
  return { ok: true, ended, overview: buildStudio() };
}

export function deliverStudioBrief(input = {}, actor = 'system') {
  const rows = listBriefdesk().filter((x) => x.status === 'intake' || x.status === 'in_prod');
  const delivered = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBriefdesk(row.id, { status: 'delivered', touched_by: actor }, actor);
    if (next) delivered.push(next.id);
  }
  if (!delivered.length) {
    const seeded = createBriefdesk({ brief: 'studio', owner: 'ops', status: 'delivered' }, actor);
    delivered.push(seeded.id);
  }
  for (const b of listBoostdesk().filter((x) => x.status === 'draft').slice(0, 5)) { updateBoostdesk(b.id, { status: 'running', touched_by: actor }, actor); }
  for (const s of listSponsorpack().filter((x) => x.status === 'pitched' || x.status === 'signed').slice(0, 5)) { updateSponsorpack(s.id, { status: 'live', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'KALYPSO', title: `studio brief_deliver · ${delivered.length}`, priority: 'normal', payload: { ids: delivered } }, actor);
  appendAudit({ actor, action: 'studio.brief_deliver', detail: `${delivered.length}`, meta: { n: delivered.length } });
  return { ok: true, delivered, overview: buildStudio() };
}
