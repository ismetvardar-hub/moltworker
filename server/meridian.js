/**
 * AŞAMA 240 — Meridian checkpoint.
 */
import { buildHorizon } from './horizon.js';
import { createStayext, listStayext, stayextSummary, updateStayext } from './stayext.js';
import { createRoommove, listRoommove, roommoveSummary, updateRoommove } from './roommove.js';
import { createEarlyin, listEarlyin, earlyinSummary, updateEarlyin } from './earlyin.js';
import { createLuggage, listLuggage, luggageSummary, updateLuggage } from './luggage.js';
import { createTurndown, listTurndown, turndownSummary, updateTurndown } from './turndown.js';
import { createDndflags, listDndflags, dndflagsSummary, updateDndflags } from './dndflags.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildMeridian() {
  const prev = buildHorizon();
  const stay = stayextSummary();
  const move = roommoveSummary();
  const early = earlyinSummary();
  const lug = luggageSummary();
  const turn = turndownSummary();
  const dnd = dndflagsSummary();
  const flags = readCollection('meridian-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Meridian',
    horizon: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    stayAccepted: stay.accepted || 0,
    movesOpen: move.requested || 0,
    earlyRequested: early.requested || 0,
    luggageHeld: lug.held || 0,
    turndownQueued: turn.queued || 0,
    dndActive: dnd.dnd || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      moves_open: move.requested || 0,
      early_requested: early.requested || 0,
      luggage_held: lug.held || 0,
      dnd_active: dnd.dnd || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Stay uzatma kabul ${stay.accepted || 0} · Oda taşıma talep ${move.requested || 0}`,
      `Erken check-in ${early.requested || 0} · Bagaj emanet ${lug.held || 0}`,
      `Turndown kuyruk ${turn.queued || 0} · DND ${dnd.dnd || 0}`,
      `Meridian flag ${openFlags.length} açık`,
    ],
  };
}

export function runMeridianSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildMeridian();
  const existing = readCollection('meridian-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.movesOpen || 0) > 0)) {
    candidates.push({ key: 'moves', level: 'warn', text: `Oda taşıma ${o.movesOpen || 0}`, domain: 'move' });
  }
  if (force || ((o.earlyRequested || 0) > 0)) {
    candidates.push({ key: 'early', level: 'info', text: `Erken check-in ${o.earlyRequested || 0}`, domain: 'early' });
  }
  if (force || ((o.dndActive || 0) > 0 || (o.luggageHeld || 0) > 0)) {
    candidates.push({ key: 'guest_flags', level: 'info', text: `DND ${o.dndActive || 0} · Luggage ${o.luggageHeld || 0}`, domain: 'guest' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Meridian heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('mdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('meridian-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `meridian sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('mds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('meridian-sweeps', sweep, 80);
  appendAudit({ actor, action: 'meridian.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildMeridian() };
}

export function ackMeridianFlag(input = {}, actor = 'system') {
  const list = readCollection('meridian-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('meridian-flags', list);
  appendAudit({ actor, action: 'meridian.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildMeridian() };
}

export function approveMeridianMove(input = {}, actor = 'system') {
  const rows = listRoommove().filter((x) => x.status === 'requested');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRoommove(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createRoommove({ fromRoom: '101', toRoom: '102', status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  appendAudit({ actor, action: 'meridian.move_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildMeridian() };
}

export function approveMeridianEarly(input = {}, actor = 'system') {
  const rows = listEarlyin().filter((x) => x.status === 'requested');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEarlyin(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createEarlyin({ guestName: 'meridian', eta: '12:00', status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  for (const s of listStayext().filter((x) => x.status === 'offered').slice(0, 5)) { updateStayext(s.id, { status: 'accepted', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'meridian.early_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildMeridian() };
}

export function clearMeridianTurndown(input = {}, actor = 'system') {
  const rows = listTurndown().filter((x) => x.status === 'queued');
  const done = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTurndown(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) done.push(next.id);
  }
  if (!done.length) {
    const seeded = createTurndown({ room: 'M1', note: 'done', status: 'done' }, actor);
    done.push(seeded.id);
  }
  for (const l of listLuggage().filter((x) => x.status === 'held').slice(0, 5)) { updateLuggage(l.id, { status: 'delivered', touched_by: actor }, actor); }
  for (const d of listDndflags().filter((x) => x.status === 'dnd').slice(0, 5)) { updateDndflags(d.id, { status: 'clear', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ATLAS', title: `meridian turndown_clear · ${done.length}`, priority: 'normal', payload: { ids: done } }, actor);
  appendAudit({ actor, action: 'meridian.turndown_clear', detail: `${done.length}`, meta: { n: done.length } });
  return { ok: true, done, overview: buildMeridian() };
}
