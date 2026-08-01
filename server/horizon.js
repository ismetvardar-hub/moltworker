/**
 * AŞAMA 225 — Horizon checkpoint.
 */
import { buildSentinel } from './sentinel.js';
import { createRevpulse, listRevpulse, revpulseSummary, updateRevpulse } from './revpulse.js';
import { createVoidlog, listVoidlog, voidlogSummary, updateVoidlog } from './voidlog.js';
import { createComps, listComps, compsSummary, updateComps } from './comps.js';
import { createTabopen, listTabopen, tabopenSummary, updateTabopen } from './tabopen.js';
import { createAllergenalert, listAllergenalert, allergenalertSummary, updateAllergenalert } from './allergenalert.js';
import { createTempprobe, listTempprobe, tempprobeSummary, updateTempprobe } from './tempprobe.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildHorizon() {
  const prev = buildSentinel();
  const rev = revpulseSummary();
  const voids = voidlogSummary();
  const comps = compsSummary();
  const tabs = tabopenSummary();
  const allergy = allergenalertSummary();
  const probe = tempprobeSummary();
  const flags = readCollection('horizon-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Horizon',
    sentinel: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    revLive: rev.live || 0,
    voidsOpen: voids.logged || 0,
    compsRequested: comps.requested || 0,
    tabsOpen: tabs.open || 0,
    allergyOpen: allergy.open || 0,
    probeFail: probe.fail || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      tabs_open: tabs.open || 0,
      allergy_open: allergy.open || 0,
      probe_fail: probe.fail || 0,
      comps_requested: comps.requested || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Rev pulse live ${rev.live || 0} · Açık tab ${tabs.open || 0}`,
      `Void logged ${voids.logged || 0} · Comp talep ${comps.requested || 0}`,
      `Alerjen açık ${allergy.open || 0} · Probe fail ${probe.fail || 0}`,
      `Horizon flag ${openFlags.length} açık`,
    ],
  };
}

export function runHorizonSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildHorizon();
  const existing = readCollection('horizon-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.allergyOpen || 0) > 0 || (o.probeFail || 0) > 0)) {
    candidates.push({ key: 'safety', level: 'alert', text: `Allergy ${o.allergyOpen || 0} · Probe fail ${o.probeFail || 0}`, domain: 'safety' });
  }
  if (force || ((o.tabsOpen || 0) > 0)) {
    candidates.push({ key: 'tabs', level: 'warn', text: `Açık tab ${o.tabsOpen || 0}`, domain: 'tabs' });
  }
  if (force || ((o.compsRequested || 0) > 0)) {
    candidates.push({ key: 'comps', level: 'info', text: `Comp talep ${o.compsRequested || 0}`, domain: 'comps' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Horizon heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('hzf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('horizon-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'PLUTUS', title: `horizon sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('hzs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('horizon-sweeps', sweep, 80);
  appendAudit({ actor, action: 'horizon.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildHorizon() };
}

export function ackHorizonFlag(input = {}, actor = 'system') {
  const list = readCollection('horizon-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('horizon-flags', list);
  appendAudit({ actor, action: 'horizon.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildHorizon() };
}

export function clearHorizonAllergy(input = {}, actor = 'system') {
  const rows = listAllergenalert().filter((x) => x.status === 'open');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAllergenalert(row.id, { status: 'cleared', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createAllergenalert({ dish: 'horizon', flag: 'gluten', status: 'cleared' }, actor);
    cleared.push(seeded.id);
  }
  for (const p of listTempprobe().filter((x) => x.status === 'fail' || x.status === 'warn').slice(0, 5)) { updateTempprobe(p.id, { status: 'ok', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'horizon.allergy_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildHorizon() };
}

export function closeHorizonTabs(input = {}, actor = 'system') {
  const rows = listTabopen().filter((x) => x.status === 'open' || x.status === 'settling');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTabopen(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createTabopen({ guestName: 'horizon', balance: 0, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'horizon.tab_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildHorizon() };
}

export function approveHorizonComps(input = {}, actor = 'system') {
  const rows = listComps().filter((x) => x.status === 'requested');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateComps(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createComps({ guestName: 'horizon', amount: 1, status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  for (const v of listVoidlog().filter((x) => x.status === 'logged').slice(0, 5)) { updateVoidlog(v.id, { status: 'reviewed', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'PLUTUS', title: `horizon comp_approve · ${approved.length}`, priority: 'normal', payload: { ids: approved } }, actor);
  appendAudit({ actor, action: 'horizon.comp_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildHorizon() };
}
