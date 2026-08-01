/**
 * AŞAMA 300 — Brand Pulse checkpoint (ecosphere + marka/içerik sinyalleri).
 */
import { buildEcosphere } from './ecosphere.js';
import { createSocialinbox, listSocialinbox, socialinboxSummary, updateSocialinbox } from './socialinbox.js';
import { createUgcmod, listUgcmod, ugcmodSummary, updateUgcmod } from './ugcmod.js';
import { adspendSummary } from './adspend.js';
import { brandguardSummary, createBrandguard, listBrandguard, updateBrandguard } from './brandguard.js';
import { creativereqSummary } from './creativereq.js';
import { livestreamSummary } from './livestream.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildBrandpulse() {
  const eco = buildEcosphere();
  const inbox = socialinboxSummary();
  const ugc = ugcmodSummary();
  const ads = adspendSummary();
  const guard = brandguardSummary();
  const creative = creativereqSummary();
  const live = livestreamSummary();
  const flags = readCollection('brandpulse-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Brand Pulse',
    ecosphere: { summaryLines: (eco.summaryLines || []).slice(0, 2) },
    inboxNew: inbox.new || 0,
    ugcQueued: ugc.queued || 0,
    adsLive: ads.live || 0,
    brandWatching: guard.watching || 0,
    creativeQueued: creative.queued || 0,
    livestreamLive: live.live || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      inbox_new: inbox.new || 0,
      ugc_queued: ugc.queued || 0,
      brand_watching: guard.watching || 0,
    },
    summaryLines: [
      ...(eco.summaryLines || []).slice(0, 2),
      `Sosyal inbox yeni ${inbox.new || 0} · UGC kuyruk ${ugc.queued || 0}`,
      `Reklam live ${ads.live || 0} · Marka izleme ${guard.watching || 0}`,
      `Kreatif kuyruk ${creative.queued || 0} · Livestream live ${live.live || 0}`,
      `Brand Pulse flag ${openFlags.length} açık`,
    ],
  };
}

export function runBrandpulseSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const b = buildBrandpulse();
  const existing = readCollection('brandpulse-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (b.inboxNew || 0) > 0) {
    candidates.push({ key: 'inbox_new', level: 'warn', text: `Sosyal inbox yeni ${b.inboxNew || 0}`, domain: 'inbox' });
  }
  if (force || (b.ugcQueued || 0) > 0) {
    candidates.push({ key: 'ugc_queued', level: 'info', text: `UGC kuyruk ${b.ugcQueued || 0}`, domain: 'ugc' });
  }
  if (force || (b.brandWatching || 0) > 0) {
    candidates.push({ key: 'brand_watch', level: 'alert', text: `Marka izleme ${b.brandWatching || 0}`, domain: 'guard' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Brand Pulse heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('bpf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('brandpulse-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'KALYPSO',
        title: `brandpulse sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('bps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('brandpulse-sweeps', sweep, 80);
  appendAudit({ actor, action: 'brandpulse.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildBrandpulse() };
}

export function ackBrandpulseFlag(input = {}, actor = 'system') {
  const list = readCollection('brandpulse-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('brandpulse-flags', list);
  appendAudit({ actor, action: 'brandpulse.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildBrandpulse() };
}

export function triageBrandpulseInbox(input = {}, actor = 'system') {
  const neu = listSocialinbox().filter((m) => m.status === 'new');
  const replied = [];
  for (const m of neu.slice(0, Number(input.limit) || 20)) {
    if (input.id && m.id !== input.id) continue;
    const next = updateSocialinbox(m.id, { status: 'replied', triaged_by: actor }, actor);
    if (next) replied.push(next.id);
  }
  if (!replied.length) {
    const seeded = createSocialinbox({ platform: 'IG', status: 'replied' }, actor);
    replied.push(seeded.id);
  }
  appendAudit({ actor, action: 'brandpulse.inbox_triage', detail: `${replied.length}`, meta: { n: replied.length } });
  return { ok: true, replied, overview: buildBrandpulse() };
}

export function approveBrandpulseUgc(input = {}, actor = 'system') {
  const queued = listUgcmod().filter((u) => u.status === 'queued');
  const approved = [];
  for (const u of queued.slice(0, Number(input.limit) || 20)) {
    if (input.id && u.id !== input.id) continue;
    const next = updateUgcmod(u.id, { status: 'approved', approved_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createUgcmod({ author: 'brandpulse', status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  appendAudit({ actor, action: 'brandpulse.ugc_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildBrandpulse() };
}

export function actionBrandpulseGuard(input = {}, actor = 'system') {
  const watching = listBrandguard().filter((g) => g.status === 'watching');
  const actioned = [];
  for (const g of watching.slice(0, Number(input.limit) || 20)) {
    if (input.id && g.id !== input.id) continue;
    const next = updateBrandguard(g.id, { status: 'actioned', actioned_by: actor }, actor);
    if (next) actioned.push(next.id);
  }
  if (!actioned.length) {
    const seeded = createBrandguard({ target: input.target || 'brandpulse', status: 'actioned' }, actor);
    actioned.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'KALYPSO',
      title: `brandguard action · ${actioned.length}`,
      priority: 'high',
      payload: { ids: actioned },
    },
    actor,
  );
  appendAudit({ actor, action: 'brandpulse.guard_action', detail: `${actioned.length}`, meta: { n: actioned.length } });
  return { ok: true, actioned, overview: buildBrandpulse() };
}
