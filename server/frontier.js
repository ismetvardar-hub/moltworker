/**
 * AŞAMA 855 — Frontier checkpoint.
 */
import { buildPhoenix } from './phoenix.js';
import { createRestorejob, listRestorejob, restorejobSummary, updateRestorejob } from './restorejob.js';
import { createSitehunt, listSitehunt, sitehuntSummary, updateSitehunt } from './sitehunt.js';
import { createSoftopen, listSoftopen, softopenSummary, updateSoftopen } from './softopen.js';
import { createLocalhire, listLocalhire, localhireSummary, updateLocalhire } from './localhire.js';
import { createLandlease, listLandlease, landleaseSummary, updateLandlease } from './landlease.js';
import { createFfespec, listFfespec, ffespecSummary, updateFfespec } from './ffespec.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildFrontier() {
  const prev = buildPhoenix();
  const s0 = restorejobSummary();
  const s1 = sitehuntSummary();
  const s2 = softopenSummary();
  const s3 = localhireSummary();
  const s4 = landleaseSummary();
  const s5 = ffespecSummary();
  const flags = readCollection('frontier-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Frontier',
    phoenix: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    restorejobSig: s0.planned || 0,
    sitehuntSig: s1.idle || 0,
    softopenSig: s2.open || 0,
    localhireSig: s3.draft || 0,
    landleaseSig: s4.planned || 0,
    ffespecSig: s5.idle || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      restore_planned: s0.planned || 0,
      site_idle: s1.idle || 0,
      hire_draft: s3.draft || 0,
      soft_open: s2.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Restore Job ${s0.planned || 0} · Site Hunt ${s1.idle || 0}`,
      `Soft Open ${s2.open || 0} · Local Hire ${s3.draft || 0}`,
      `Land Lease ${s4.planned || 0} · FFE Spec ${s5.idle || 0}`,
      `Frontier flag ${openFlags.length} açık`,
    ],
  };
}

export function runFrontierSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildFrontier();
  const existing = readCollection('frontier-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.restorejobSig || 0) > 0 || (o.landleaseSig || 0) > 0)) {
    candidates.push({ key: 'restore', level: 'alert', text: `Restore planned ${o.restorejobSig || 0} · Lease ${o.landleaseSig || 0}`, domain: 'restore' });
  }
  if (force || ((o.sitehuntSig || 0) > 0 || (o.ffespecSig || 0) > 0)) {
    candidates.push({ key: 'site', level: 'warn', text: `Site idle ${o.sitehuntSig || 0} · FFE ${o.ffespecSig || 0}`, domain: 'site' });
  }
  if (force || ((o.localhireSig || 0) > 0 || (o.softopenSig || 0) > 0)) {
    candidates.push({ key: 'hire', level: 'info', text: `Hire draft ${o.localhireSig || 0} · Soft open ${o.softopenSig || 0}`, domain: 'hire' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Frontier heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('frf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('frontier-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `frontier sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('frs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('frontier-sweeps', sweep, 80);
  appendAudit({ actor, action: 'frontier.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildFrontier() };
}

export function ackFrontierFlag(input = {}, actor = 'system') {
  const list = readCollection('frontier-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('frontier-flags', list);
  appendAudit({ actor, action: 'frontier.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildFrontier() };
}

export function runFrontierRestore(input = {}, actor = 'system') {
  const rows = listRestorejob().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRestorejob(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createRestorejob({ system: 'frontier', eta: 'soon', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const l of listLandlease().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateLandlease(l.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'frontier.restore_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildFrontier() };
}

export function busyFrontierSite(input = {}, actor = 'system') {
  const rows = listSitehunt().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSitehunt(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createSitehunt({ city: 'frontier', score: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const f of listFfespec().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateFfespec(f.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'frontier.site_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildFrontier() };
}

export function liveFrontierHire(input = {}, actor = 'system') {
  const rows = listLocalhire().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLocalhire(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createLocalhire({ site: 'frontier', headcount: 5, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const s of listSoftopen().filter((x) => x.status === 'open').slice(0, 5)) {
    updateSoftopen(s.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `frontier hire_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'frontier.hire_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildFrontier() };
}
