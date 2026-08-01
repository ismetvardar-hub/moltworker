/**
 * AŞAMA 990 — Circuit2 checkpoint.
 */
import { buildSerenity2 } from './serenity2.js';
import { createMomentmap2, listMomentmap2, momentmap2Summary, updateMomentmap2 } from './momentmap2.js';
import { createWebhookhub2, listWebhookhub2, webhookhub2Summary, updateWebhookhub2 } from './webhookhub2.js';
import { createSchemareg2, listSchemareg2, schemareg2Summary, updateSchemareg2 } from './schemareg2.js';
import { createJobqueue22, listJobqueue22, jobqueue22Summary, updateJobqueue22 } from './jobqueue22.js';
import { createCdnedge2, listCdnedge2, cdnedge2Summary, updateCdnedge2 } from './cdnedge2.js';
import { createErrorbudget3, listErrorbudget3, errorbudget3Summary, updateErrorbudget3 } from './errorbudget3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCircuit2() {
  const prev = buildSerenity2();
  const s0 = momentmap2Summary();
  const s1 = webhookhub2Summary();
  const s2 = schemareg2Summary();
  const s3 = jobqueue22Summary();
  const s4 = cdnedge2Summary();
  const s5 = errorbudget3Summary();
  const flags = readCollection('circuit2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Circuit2',
    serenity2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    momentmap2Sig: s0.idle || 0,
    webhookhub2Sig: s1.open || 0,
    schemareg2Sig: s2.draft || 0,
    jobqueue22Sig: s3.planned || 0,
    cdnedge2Sig: s4.idle || 0,
    errorbudget3Sig: s5.open || 0,
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
      `Circuit2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runCircuit2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCircuit2();
  const existing = readCollection('circuit2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.momentmap2Sig || 0) > 0 || (o.cdnedge2Sig || 0) > 0)) {
    candidates.push({ key: 'moment', level: 'alert', text: `Moment idle ${o.momentmap2Sig || 0} · CDN ${o.cdnedge2Sig || 0}`, domain: 'moment' });
  }
  if (force || ((o.webhookhub2Sig || 0) > 0 || (o.errorbudget3Sig || 0) > 0)) {
    candidates.push({ key: 'hook', level: 'warn', text: `Hook open ${o.webhookhub2Sig || 0} · Budget ${o.errorbudget3Sig || 0}`, domain: 'hook' });
  }
  if (force || ((o.schemareg2Sig || 0) > 0 || (o.jobqueue22Sig || 0) > 0)) {
    candidates.push({ key: 'schema', level: 'info', text: `Schema draft ${o.schemareg2Sig || 0} · Jobs ${o.jobqueue22Sig || 0}`, domain: 'schema' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Circuit2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ci2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('circuit2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `circuit2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ci2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('circuit2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'circuit2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCircuit2() };
}

export function ackCircuit2Flag(input = {}, actor = 'system') {
  const list = readCollection('circuit2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('circuit2-flags', list);
  appendAudit({ actor, action: 'circuit2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCircuit2() };
}

export function busyCircuit2Moment(input = {}, actor = 'system') {
  const rows = listMomentmap2().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateMomentmap2(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createMomentmap2({ moment: 'circuit2', zone: 'core', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listCdnedge2().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateCdnedge2(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'circuit2.moment_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildCircuit2() };
}

export function closeCircuit2Hook(input = {}, actor = 'system') {
  const rows = listWebhookhub2().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWebhookhub2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createWebhookhub2({ url: '/circuit2', event: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const e of listErrorbudget3().filter((x) => x.status === 'open').slice(0, 5)) {
    updateErrorbudget3(e.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'circuit2.hook_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildCircuit2() };
}

export function liveCircuit2Schema(input = {}, actor = 'system') {
  const rows = listSchemareg2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSchemareg2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSchemareg2({ schema: 'circuit2', version: 1, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const j of listJobqueue22().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateJobqueue22(j.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `circuit2 schema_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'circuit2.schema_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCircuit2() };
}
