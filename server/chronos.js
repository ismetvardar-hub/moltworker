/**
 * AŞAMA 1140 — Chronos checkpoint.
 */
import { buildGaia } from './gaia.js';
import { createMomentmap3, listMomentmap3, momentmap3Summary, updateMomentmap3 } from './momentmap3.js';
import { createWebhookhub3, listWebhookhub3, webhookhub3Summary, updateWebhookhub3 } from './webhookhub3.js';
import { createSchemareg3, listSchemareg3, schemareg3Summary, updateSchemareg3 } from './schemareg3.js';
import { createJobqueue23, listJobqueue23, jobqueue23Summary, updateJobqueue23 } from './jobqueue23.js';
import { createCdnedge3, listCdnedge3, cdnedge3Summary, updateCdnedge3 } from './cdnedge3.js';
import { createErrorbudget4, listErrorbudget4, errorbudget4Summary, updateErrorbudget4 } from './errorbudget4.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildChronos() {
  const prev = buildGaia();
  const s0 = momentmap3Summary();
  const s1 = webhookhub3Summary();
  const s2 = schemareg3Summary();
  const s3 = jobqueue23Summary();
  const s4 = cdnedge3Summary();
  const s5 = errorbudget4Summary();
  const flags = readCollection('chronos-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Chronos',
    gaia: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    momentmap3Sig: s0.idle || 0,
    webhookhub3Sig: s1.open || 0,
    schemareg3Sig: s2.draft || 0,
    jobqueue23Sig: s3.planned || 0,
    cdnedge3Sig: s4.idle || 0,
    errorbudget4Sig: s5.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      moment_idle: s0.idle || 0,
      hook_open: s1.open || 0,
      schema_draft: s2.draft || 0,
      budget_open: s5.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Moment Map ${s0.idle || 0} · Webhook Hub ${s1.open || 0}`,
      `Schema Reg ${s2.draft || 0} · Job Queue+ ${s3.planned || 0}`,
      `CDN Edge ${s4.idle || 0} · Error Budget ${s5.open || 0}`,
      `Chronos flag ${openFlags.length} açık`,
    ],
  };
}

export function runChronosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildChronos();
  const existing = readCollection('chronos-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.momentmap3Sig || 0) > 0 || (o.cdnedge3Sig || 0) > 0)) {
    candidates.push({ key: 'moment', level: 'alert', text: `Moment idle ${o.momentmap3Sig || 0} · CDN ${o.cdnedge3Sig || 0}`, domain: 'moment' });
  }
  if (force || ((o.webhookhub3Sig || 0) > 0 || (o.errorbudget4Sig || 0) > 0)) {
    candidates.push({ key: 'hook', level: 'warn', text: `Hook open ${o.webhookhub3Sig || 0} · Budget ${o.errorbudget4Sig || 0}`, domain: 'hook' });
  }
  if (force || ((o.schemareg3Sig || 0) > 0 || (o.jobqueue23Sig || 0) > 0)) {
    candidates.push({ key: 'schema', level: 'info', text: `Schema draft ${o.schemareg3Sig || 0} · Jobs ${o.jobqueue23Sig || 0}`, domain: 'schema' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Chronos heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('chf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('chronos-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `chronos sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('chs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('chronos-sweeps', sweep, 80);
  appendAudit({ actor, action: 'chronos.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildChronos() };
}

export function ackChronosFlag(input = {}, actor = 'system') {
  const list = readCollection('chronos-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('chronos-flags', list);
  appendAudit({ actor, action: 'chronos.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildChronos() };
}

export function busyChronosMoment(input = {}, actor = 'system') {
  const rows = listMomentmap3().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateMomentmap3(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createMomentmap3({ moment: 'chronos', zone: 'core', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listCdnedge3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateCdnedge3(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'chronos.moment_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildChronos() };
}

export function closeChronosHook(input = {}, actor = 'system') {
  const rows = listWebhookhub3().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWebhookhub3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createWebhookhub3({ url: '/chronos', event: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const e of listErrorbudget4().filter((x) => x.status === 'open').slice(0, 5)) {
    updateErrorbudget4(e.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'chronos.hook_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildChronos() };
}

export function liveChronosSchema(input = {}, actor = 'system') {
  const rows = listSchemareg3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSchemareg3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSchemareg3({ schema: 'chronos', version: 1, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const j of listJobqueue23().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateJobqueue23(j.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `chronos schema_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'chronos.schema_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildChronos() };
}
