/**
 * AŞAMA 645 — Empire checkpoint.
 */
import { buildAtlas } from './atlas.js';
import { createTybridge, listTybridge, tybridgeSummary, updateTybridge } from './tybridge.js';
import { createDolaplist, listDolaplist, dolaplistSummary, updateDolaplist } from './dolaplist.js';
import { createHephapick, listHephapick, hephapickSummary, updateHephapick } from './hephapick.js';
import { createTourpack, listTourpack, tourpackSummary, updateTourpack } from './tourpack.js';
import { createStaybook, listStaybook, staybookSummary, updateStaybook } from './staybook.js';
import { createSportslot, listSportslot, sportslotSummary, updateSportslot } from './sportslot.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildEmpire() {
  const prev = buildAtlas();
  const ty = tybridgeSummary();
  const dolap = dolaplistSummary();
  const heph = hephapickSummary();
  const tour = tourpackSummary();
  const stay = staybookSummary();
  const sport = sportslotSummary();
  const flags = readCollection('empire-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Empire',
    atlas: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    tyError: ty.error || 0,
    dolapListed: dolap.listed || 0,
    hephQueued: heph.queued || 0,
    tourOpen: tour.open || 0,
    stayInhouse: stay.inhouse || 0,
    sportBooked: sport.booked || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      ty_error: ty.error || 0,
      heph_queued: heph.queued || 0,
      tour_open: tour.open || 0,
      sport_booked: sport.booked || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Trendyol errors ${ty.error || 0} · Dolap listed ${dolap.listed || 0}`,
      `Hepha queued ${heph.queued || 0} · Tour packs open ${tour.open || 0}`,
      `Stay in-house ${stay.inhouse || 0} · Sport slots booked ${sport.booked || 0}`,
      `Empire flag ${openFlags.length} açık`,
    ],
  };
}

export function runEmpireSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildEmpire();
  const existing = readCollection('empire-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.tyError || 0) > 0)) {
    candidates.push({ key: 'ty_error', level: 'alert', text: `Trendyol errors ${o.tyError || 0}`, domain: 'ty' });
  }
  if (force || ((o.hephQueued || 0) > 0)) {
    candidates.push({ key: 'heph_q', level: 'warn', text: `Hepha queued ${o.hephQueued || 0}`, domain: 'hepha' });
  }
  if (force || ((o.tourOpen || 0) > 0 || (o.sportBooked || 0) > 0)) {
    candidates.push({ key: 'exp', level: 'info', text: `Tour ${o.tourOpen || 0} · Sport booked ${o.sportBooked || 0}`, domain: 'exp' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Empire heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('emf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('empire-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'HERMES-SALES', title: `empire sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ems'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('empire-sweeps', sweep, 80);
  appendAudit({ actor, action: 'empire.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildEmpire() };
}

export function ackEmpireFlag(input = {}, actor = 'system') {
  const list = readCollection('empire-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('empire-flags', list);
  appendAudit({ actor, action: 'empire.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildEmpire() };
}

export function syncEmpireTy(input = {}, actor = 'system') {
  const rows = listTybridge().filter((x) => x.status === 'error' || x.status === 'queued');
  const synced = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTybridge(row.id, { status: 'synced', touched_by: actor }, actor);
    if (next) synced.push(next.id);
  }
  if (!synced.length) {
    const seeded = createTybridge({ sku: 'E1', qty: 1, status: 'synced' }, actor);
    synced.push(seeded.id);
  }
  appendAudit({ actor, action: 'empire.ty_sync', detail: `${synced.length}`, meta: { n: synced.length } });
  return { ok: true, synced, overview: buildEmpire() };
}

export function shipEmpireHepha(input = {}, actor = 'system') {
  const rows = listHephapick().filter((x) => x.status === 'queued' || x.status === 'picking' || x.status === 'packed');
  const shipped = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHephapick(row.id, { status: 'shipped', touched_by: actor }, actor);
    if (next) shipped.push(next.id);
  }
  if (!shipped.length) {
    const seeded = createHephapick({ order: 'E1', bin: 'B1', status: 'shipped' }, actor);
    shipped.push(seeded.id);
  }
  for (const d of listDolaplist().filter((x) => x.status === 'draft').slice(0, 5)) { updateDolaplist(d.id, { status: 'listed', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'empire.hepha_ship', detail: `${shipped.length}`, meta: { n: shipped.length } });
  return { ok: true, shipped, overview: buildEmpire() };
}

export function departEmpireTour(input = {}, actor = 'system') {
  const rows = listTourpack().filter((x) => x.status === 'open' || x.status === 'full');
  const departed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTourpack(row.id, { status: 'departed', touched_by: actor }, actor);
    if (next) departed.push(next.id);
  }
  if (!departed.length) {
    const seeded = createTourpack({ pack: 'E1', pax: 2, status: 'departed' }, actor);
    departed.push(seeded.id);
  }
  for (const s of listSportslot().filter((x) => x.status === 'booked').slice(0, 5)) { updateSportslot(s.id, { status: 'live', touched_by: actor }, actor); }
  for (const s of listStaybook().filter((x) => x.status === 'hold' || x.status === 'confirmed').slice(0, 5)) { updateStaybook(s.id, { status: 'inhouse', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'HERMES-SALES', title: `empire tour_depart · ${departed.length}`, priority: 'normal', payload: { ids: departed } }, actor);
  appendAudit({ actor, action: 'empire.tour_depart', detail: `${departed.length}`, meta: { n: departed.length } });
  return { ok: true, departed, overview: buildEmpire() };
}
