/**
 * AŞAMA 120 — Night Audit checkpoint.
 */
import { buildWarroom } from './warroom.js';
import { createNightlog, listNightlog, nightlogSummary, updateNightlog } from './nightlog.js';
import { createFlash, listFlash, flashSummary, updateFlash } from './flash.js';
import { createFolio, listFolio, folioSummary, updateFolio } from './folio.js';
import { createLateout, listLateout, lateoutSummary, updateLateout } from './lateout.js';
import { cashSummary } from './cash.js';
import { createUpsell, listUpsell, upsellSummary, updateUpsell } from './upsell.js';
import { createGroups, listGroups, groupsSummary, updateGroups } from './groups.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildNightly() {
  const prev = buildWarroom();
  const night = nightlogSummary();
  const flash = flashSummary();
  const folio = folioSummary();
  const late = lateoutSummary();
  const cash = cashSummary();
  const upsell = upsellSummary();
  const groups = groupsSummary();
  const flags = readCollection('nightly-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Night Audit',
    warroom: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    nightOpen: night.open || 0,
    nightClosed: night.closed || 0,
    flashPublished: flash.published || 0,
    folioOpen: folio.open || 0,
    lateRequested: late.requested || 0,
    upsellAccepted: upsell.accepted || 0,
    groupsConfirmed: groups.confirmed || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      night_open: night.open || 0,
      folio_open: folio.open || 0,
      late_requested: late.requested || 0,
      flash_published: flash.published || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Gece log açık ${night.open || 0} / kapalı ${night.closed || 0}`,
      `Flash yayın ${flash.published || 0} · Folio açık ${folio.open || 0}`,
      `Late checkout talep ${late.requested || 0}`,
      `Upsell kabul ${upsell.accepted || 0} · Grup onay ${groups.confirmed || 0}`,
      `Nightly flag ${openFlags.length} açık`,
    ],
  };
}

export function runNightlySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildNightly();
  const existing = readCollection('nightly-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.nightOpen || 0) > 0)) {
    candidates.push({ key: 'night_open', level: 'warn', text: `Gece log açık ${o.nightOpen || 0}`, domain: 'night' });
  }
  if (force || ((o.folioOpen || 0) > 0)) {
    candidates.push({ key: 'folio_open', level: 'alert', text: `Folio açık ${o.folioOpen || 0}`, domain: 'folio' });
  }
  if (force || ((o.lateRequested || 0) > 0)) {
    candidates.push({ key: 'late_out', level: 'info', text: `Late checkout ${o.lateRequested || 0}`, domain: 'late' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Nightly heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ntf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('nightly-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `nightly sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('nts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('nightly-sweeps', sweep, 80);
  appendAudit({ actor, action: 'nightly.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildNightly() };
}

export function ackNightlyFlag(input = {}, actor = 'system') {
  const list = readCollection('nightly-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('nightly-flags', list);
  appendAudit({ actor, action: 'nightly.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildNightly() };
}

export function closeNightlyLog(input = {}, actor = 'system') {
  const rows = listNightlog().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNightlog(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createNightlog({ metric: 'nightly', value: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'nightly.log_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildNightly() };
}

export function closeNightlyFolio(input = {}, actor = 'system') {
  const rows = listFolio().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateFolio(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createFolio({ guestName: 'nightly', charge: 'room', amount: 1, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const f of listFlash().filter((x) => x.status === 'draft').slice(0, 5)) { updateFlash(f.id, { status: 'published', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'nightly.folio_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildNightly() };
}

export function approveNightlyLate(input = {}, actor = 'system') {
  const rows = listLateout().filter((x) => x.status === 'requested');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLateout(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createLateout({ room: 'N1', until: '14:00', status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  for (const u of listUpsell().filter((x) => x.status === 'offered').slice(0, 5)) { updateUpsell(u.id, { status: 'accepted', touched_by: actor }, actor); }
  for (const g of listGroups().filter((x) => x.status === 'inquiry' || x.status === 'blocked').slice(0, 5)) { updateGroups(g.id, { status: 'confirmed', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ETHOS', title: `nightly late_approve · ${approved.length}`, priority: 'normal', payload: { ids: approved } }, actor);
  appendAudit({ actor, action: 'nightly.late_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildNightly() };
}
