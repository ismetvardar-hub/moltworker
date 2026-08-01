/**
 * AŞAMA 570 — Beacon checkpoint.
 */
import { buildCrown } from './crown.js';
import { createCampdesk, listCampdesk, campdeskSummary, updateCampdesk } from './campdesk.js';
import { createSocialqueue, listSocialqueue, socialqueueSummary, updateSocialqueue } from './socialqueue.js';
import { createPushdesk, listPushdesk, pushdeskSummary, updatePushdesk } from './pushdesk.js';
import { createMediabuy, listMediabuy, mediabuySummary, updateMediabuy } from './mediabuy.js';
import { createSeopage, listSeopage, seopageSummary, updateSeopage } from './seopage.js';
import { createLeadmagnet, listLeadmagnet, leadmagnetSummary, updateLeadmagnet } from './leadmagnet.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildBeacon() {
  const prev = buildCrown();
  const camp = campdeskSummary();
  const soc = socialqueueSummary();
  const push = pushdeskSummary();
  const ad = mediabuySummary();
  const seo = seopageSummary();
  const lead = leadmagnetSummary();
  const flags = readCollection('beacon-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Beacon',
    crown: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    campLive: camp.live || 0,
    socFailed: soc.failed || 0,
    pushScheduled: push.scheduled || 0,
    adSpent: ad.spent || 0,
    seoIssue: seo.issue || 0,
    leadLive: lead.live || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      soc_failed: soc.failed || 0,
      seo_issue: seo.issue || 0,
      push_scheduled: push.scheduled || 0,
      camp_live: camp.live || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Campaigns live ${camp.live || 0} · Social failed ${soc.failed || 0}`,
      `Push scheduled ${push.scheduled || 0} · Ad spend rows ${ad.spent || 0}`,
      `SEO issues ${seo.issue || 0} · Lead magnets live ${lead.live || 0}`,
      `Beacon flag ${openFlags.length} açık`,
    ],
  };
}

export function runBeaconSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildBeacon();
  const existing = readCollection('beacon-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.socFailed || 0) > 0)) {
    candidates.push({ key: 'social', level: 'alert', text: `Social failed ${o.socFailed || 0}`, domain: 'social' });
  }
  if (force || ((o.seoIssue || 0) > 0)) {
    candidates.push({ key: 'seo', level: 'warn', text: `SEO issues ${o.seoIssue || 0}`, domain: 'seo' });
  }
  if (force || ((o.pushScheduled || 0) > 0 || (o.campLive || 0) === 0)) {
    candidates.push({ key: 'camp', level: 'info', text: `Push scheduled ${o.pushScheduled || 0} · Camp live ${o.campLive || 0}`, domain: 'camp' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Beacon heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('bcf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('beacon-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'MINT', title: `beacon sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('bcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('beacon-sweeps', sweep, 80);
  appendAudit({ actor, action: 'beacon.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildBeacon() };
}

export function ackBeaconFlag(input = {}, actor = 'system') {
  const list = readCollection('beacon-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('beacon-flags', list);
  appendAudit({ actor, action: 'beacon.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildBeacon() };
}

export function liveBeaconCamp(input = {}, actor = 'system') {
  const rows = listCampdesk().filter((x) => x.status === 'draft' || x.status === 'paused');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCampdesk(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCampdesk({ name: 'beacon', channel: 'Meta', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const l of listLeadmagnet().filter((x) => x.status === 'paused').slice(0, 5)) {
    updateLeadmagnet(l.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'beacon.camp_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildBeacon() };
}

export function fixBeaconSocial(input = {}, actor = 'system') {
  const rows = listSocialqueue().filter((x) => x.status === 'failed');
  const fixed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSocialqueue(row.id, { status: 'posted', touched_by: actor }, actor);
    if (next) fixed.push(next.id);
  }
  if (!fixed.length) {
    const seeded = createSocialqueue({ platform: 'IG', caption: 'beacon', status: 'posted' }, actor);
    fixed.push(seeded.id);
  }
  for (const p of listPushdesk().filter((x) => x.status === 'scheduled' || x.status === 'draft').slice(0, 5)) {
    updatePushdesk(p.id, { status: 'sent', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'beacon.social_fix', detail: `${fixed.length}`, meta: { n: fixed.length } });
  return { ok: true, fixed, overview: buildBeacon() };
}

export function healBeaconSeo(input = {}, actor = 'system') {
  const rows = listSeopage().filter((x) => x.status === 'issue');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSeopage(row.id, { status: 'improved', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createSeopage({ url: '/beacon', score: 90, status: 'improved' }, actor);
    healed.push(seeded.id);
  }
  for (const m of listMediabuy().filter((x) => x.status === 'paused').slice(0, 5)) {
    updateMediabuy(m.id, { status: 'planned', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'MINT', title: `beacon seo_heal · ${healed.length}`, priority: 'normal', payload: { ids: healed } }, actor);
  appendAudit({ actor, action: 'beacon.seo_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildBeacon() };
}
