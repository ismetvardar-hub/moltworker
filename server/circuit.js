/**
 * AŞAMA 780 — Circuit checkpoint.
 */
import { buildSerenity } from './serenity.js';
import { createMomentmap, listMomentmap, momentmapSummary, updateMomentmap } from './momentmap.js';
import { createWebhookhub, listWebhookhub, webhookhubSummary, updateWebhookhub } from './webhookhub.js';
import { createSchemareg, listSchemareg, schemaregSummary, updateSchemareg } from './schemareg.js';
import { createJobqueue2, listJobqueue2, jobqueue2Summary, updateJobqueue2 } from './jobqueue2.js';
import { createCdnedge, listCdnedge, cdnedgeSummary, updateCdnedge } from './cdnedge.js';
import { createErrorbudget2, listErrorbudget2, errorbudget2Summary, updateErrorbudget2 } from './errorbudget2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCircuit() {
  const prev = buildSerenity();
  const s0 = momentmapSummary();
  const s1 = webhookhubSummary();
  const s2 = schemaregSummary();
  const s3 = jobqueue2Summary();
  const s4 = cdnedgeSummary();
  const s5 = errorbudget2Summary();
  const flags = readCollection('circuit-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Circuit',
    serenity: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    momentmapSig: s0.idle || 0,
    webhookhubSig: s1.open || 0,
    schemaregSig: s2.draft || 0,
    jobqueue2Sig: s3.planned || 0,
    cdnedgeSig: s4.idle || 0,
    errorbudget2Sig: s5.open || 0,
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
      `Circuit flag ${openFlags.length} açık`,
    ],
  };
}

export function runCircuitSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCircuit();
  const existing = readCollection('circuit-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.momentmapSig || 0) > 0 || (o.cdnedgeSig || 0) > 0)) {
    candidates.push({ key: 'moment', level: 'alert', text: `Moment idle ${o.momentmapSig || 0} · CDN ${o.cdnedgeSig || 0}`, domain: 'moment' });
  }
  if (force || ((o.webhookhubSig || 0) > 0 || (o.errorbudget2Sig || 0) > 0)) {
    candidates.push({ key: 'hook', level: 'warn', text: `Hook open ${o.webhookhubSig || 0} · Budget ${o.errorbudget2Sig || 0}`, domain: 'hook' });
  }
  if (force || ((o.schemaregSig || 0) > 0 || (o.jobqueue2Sig || 0) > 0)) {
    candidates.push({ key: 'schema', level: 'info', text: `Schema draft ${o.schemaregSig || 0} · Jobs ${o.jobqueue2Sig || 0}`, domain: 'schema' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Circuit heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('cif'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('circuit-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `circuit sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('cis'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('circuit-sweeps', sweep, 80);
  appendAudit({ actor, action: 'circuit.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCircuit() };
}

export function ackCircuitFlag(input = {}, actor = 'system') {
  const list = readCollection('circuit-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('circuit-flags', list);
  appendAudit({ actor, action: 'circuit.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCircuit() };
}

export function busyCircuitMoment(input = {}, actor = 'system') {
  const rows = listMomentmap().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateMomentmap(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createMomentmap({ moment: 'circuit', zone: 'core', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const c of listCdnedge().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateCdnedge(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'circuit.moment_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildCircuit() };
}

export function closeCircuitHook(input = {}, actor = 'system') {
  const rows = listWebhookhub().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWebhookhub(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createWebhookhub({ url: '/circuit', event: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const e of listErrorbudget2().filter((x) => x.status === 'open').slice(0, 5)) {
    updateErrorbudget2(e.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'circuit.hook_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildCircuit() };
}

export function liveCircuitSchema(input = {}, actor = 'system') {
  const rows = listSchemareg().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSchemareg(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSchemareg({ schema: 'circuit', version: 1, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const j of listJobqueue2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateJobqueue2(j.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `circuit schema_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'circuit.schema_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCircuit() };
}
