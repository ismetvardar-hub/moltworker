/**
 * AŞAMA 420 — Tide checkpoint.
 */
import { buildOdyssey } from './odyssey.js';
import { createTidewatch, listTidewatch, tidewatchSummary, updateTidewatch } from './tidewatch.js';
import { createCliffpath, listCliffpath, cliffpathSummary, updateCliffpath } from './cliffpath.js';
import { createReefguard, listReefguard, reefguardSummary, updateReefguard } from './reefguard.js';
import { createPierops, listPierops, pieropsSummary, updatePierops } from './pierops.js';
import { createUmbrellamap, listUmbrellamap, umbrellamapSummary, updateUmbrellamap } from './umbrellamap.js';
import { createCoastpatrol, listCoastpatrol, coastpatrolSummary, updateCoastpatrol } from './coastpatrol.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildTide() {
  const prev = buildOdyssey();
  const tide = tidewatchSummary();
  const cliff = cliffpathSummary();
  const reef = reefguardSummary();
  const pier = pieropsSummary();
  const umb = umbrellamapSummary();
  const patrol = coastpatrolSummary();
  const flags = readCollection('tide-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Tide',
    odyssey: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    tideHigh: tide.high || 0,
    pathClosed: cliff.closed || 0,
    reefAlert: reef.alert || 0,
    pierBusy: pier.busy || 0,
    umbOcc: umb.occupied || 0,
    patrolOn: patrol.patrol || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      tide_high: tide.high || 0,
      path_closed: cliff.closed || 0,
      reef_alert: reef.alert || 0,
      pier_busy: pier.busy || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Tide high ${tide.high || 0} · Cliff path closed ${cliff.closed || 0}`,
      `Reef alert ${reef.alert || 0} · Pier busy ${pier.busy || 0}`,
      `Umbrella occupied ${umb.occupied || 0} · Coast patrol ${patrol.patrol || 0}`,
      `Tide flag ${openFlags.length} açık`,
    ],
  };
}

export function runTideSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildTide();
  const existing = readCollection('tide-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.reefAlert || 0) > 0)) {
    candidates.push({ key: 'reef', level: 'alert', text: `Reef alert ${o.reefAlert || 0}`, domain: 'reef' });
  }
  if (force || ((o.pathClosed || 0) > 0)) {
    candidates.push({ key: 'cliff', level: 'warn', text: `Cliff closed ${o.pathClosed || 0}`, domain: 'cliff' });
  }
  if (force || ((o.tideHigh || 0) > 0 || (o.pierBusy || 0) > 0)) {
    candidates.push({ key: 'coast', level: 'info', text: `Tide high ${o.tideHigh || 0} · Pier busy ${o.pierBusy || 0}`, domain: 'coast' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Tide heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('tdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('tide-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ODYSSEUS', title: `tide sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('tds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('tide-sweeps', sweep, 80);
  appendAudit({ actor, action: 'tide.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildTide() };
}

export function ackTideFlag(input = {}, actor = 'system') {
  const list = readCollection('tide-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('tide-flags', list);
  appendAudit({ actor, action: 'tide.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildTide() };
}

export function clearTideReef(input = {}, actor = 'system') {
  const rows = listReefguard().filter((x) => x.status === 'alert' || x.status === 'stress');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateReefguard(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createReefguard({ sector: 'T1', note: 'clear', status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'tide.reef_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildTide() };
}

export function openTideCliff(input = {}, actor = 'system') {
  const rows = listCliffpath().filter((x) => x.status === 'closed' || x.status === 'caution');
  const opened = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCliffpath(row.id, { status: 'open', touched_by: actor }, actor);
    if (next) opened.push(next.id);
  }
  if (!opened.length) {
    const seeded = createCliffpath({ segment: 'C1', condition: 'ok', status: 'open' }, actor);
    opened.push(seeded.id);
  }
  for (const t of listTidewatch().filter((x) => x.status === 'high' || x.status === 'rising').slice(0, 5)) { updateTidewatch(t.id, { status: 'falling', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'tide.cliff_open', detail: `${opened.length}`, meta: { n: opened.length } });
  return { ok: true, opened, overview: buildTide() };
}

export function freeTidePier(input = {}, actor = 'system') {
  const rows = listPierops().filter((x) => x.status === 'busy');
  const freed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePierops(row.id, { status: 'open', touched_by: actor }, actor);
    if (next) freed.push(next.id);
  }
  if (!freed.length) {
    const seeded = createPierops({ pier: 'P1', traffic: 'low', status: 'open' }, actor);
    freed.push(seeded.id);
  }
  for (const u of listUmbrellamap().filter((x) => x.status === 'occupied' || x.status === 'hold').slice(0, 5)) { updateUmbrellamap(u.id, { status: 'free', touched_by: actor }, actor); }
  for (const p of listCoastpatrol().filter((x) => x.status === 'patrol').slice(0, 5)) { updateCoastpatrol(p.id, { status: 'on_post', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ODYSSEUS', title: `tide pier_free · ${freed.length}`, priority: 'normal', payload: { ids: freed } }, actor);
  appendAudit({ actor, action: 'tide.pier_free', detail: `${freed.length}`, meta: { n: freed.length } });
  return { ok: true, freed, overview: buildTide() };
}
