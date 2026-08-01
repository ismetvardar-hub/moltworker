/**
 * AŞAMA 615 — Linen checkpoint.
 */
import { buildConvoy } from './convoy.js';
import { createHkboard, listHkboard, hkboardSummary, updateHkboard } from './hkboard.js';
import { createLinenroom, listLinenroom, linenroomSummary, updateLinenroom } from './linenroom.js';
import { createOutoforder, listOutoforder, outoforderSummary, updateOutoforder } from './outoforder.js';
import { createGuestrequest, listGuestrequest, guestrequestSummary, updateGuestrequest } from './guestrequest.js';
import { createInspectroom, listInspectroom, inspectroomSummary, updateInspectroom } from './inspectroom.js';
import { createDeepclean, listDeepclean, deepcleanSummary, updateDeepclean } from './deepclean.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildLinen() {
  const prev = buildConvoy();
  const hk = hkboardSummary();
  const linen = linenroomSummary();
  const ooo = outoforderSummary();
  const req = guestrequestSummary();
  const insp = inspectroomSummary();
  const deep = deepcleanSummary();
  const flags = readCollection('linen-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Linen',
    convoy: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    hkQueued: hk.queued || 0,
    linenLow: linen.low || 0,
    oooRooms: ooo.ooo || 0,
    reqOpen: req.open || 0,
    inspFail: insp.fail || 0,
    deepDue: deep.due || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      hk_queued: hk.queued || 0,
      linen_low: linen.low || 0,
      ooo_rooms: ooo.ooo || 0,
      insp_fail: insp.fail || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `HK queued ${hk.queued || 0} · Linen low ${linen.low || 0}`,
      `OOO rooms ${ooo.ooo || 0} · Guest requests open ${req.open || 0}`,
      `Inspect fail ${insp.fail || 0} · Deep clean due ${deep.due || 0}`,
      `Linen flag ${openFlags.length} açık`,
    ],
  };
}

export function runLinenSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildLinen();
  const existing = readCollection('linen-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.inspFail || 0) > 0)) {
    candidates.push({ key: 'insp_fail', level: 'alert', text: `Inspect fail ${o.inspFail || 0}`, domain: 'inspect' });
  }
  if (force || ((o.oooRooms || 0) > 0 || (o.linenLow || 0) > 0)) {
    candidates.push({ key: 'room_ops', level: 'warn', text: `OOO ${o.oooRooms || 0} · Linen low ${o.linenLow || 0}`, domain: 'hk' });
  }
  if (force || ((o.hkQueued || 0) > 0 || (o.reqOpen || 0) > 0)) {
    candidates.push({ key: 'queue', level: 'info', text: `HK ${o.hkQueued || 0} · Requests ${o.reqOpen || 0}`, domain: 'queue' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Linen heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('lnf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('linen-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `linen sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('lns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('linen-sweeps', sweep, 80);
  appendAudit({ actor, action: 'linen.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildLinen() };
}

export function ackLinenFlag(input = {}, actor = 'system') {
  const list = readCollection('linen-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('linen-flags', list);
  appendAudit({ actor, action: 'linen.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildLinen() };
}

export function passLinenInspect(input = {}, actor = 'system') {
  const rows = listInspectroom().filter((x) => x.status === 'fail' || x.status === 'rework');
  const passed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateInspectroom(row.id, { status: 'pass', touched_by: actor }, actor);
    if (next) passed.push(next.id);
  }
  if (!passed.length) {
    const seeded = createInspectroom({ room: 'L1', score: 95, status: 'pass' }, actor);
    passed.push(seeded.id);
  }
  appendAudit({ actor, action: 'linen.inspect_pass', detail: `${passed.length}`, meta: { n: passed.length } });
  return { ok: true, passed, overview: buildLinen() };
}

export function releaseLinenOoo(input = {}, actor = 'system') {
  const rows = listOutoforder().filter((x) => x.status === 'ooo' || x.status === 'oos');
  const released = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateOutoforder(row.id, { status: 'released', touched_by: actor }, actor);
    if (next) released.push(next.id);
  }
  if (!released.length) {
    const seeded = createOutoforder({ room: 'L1', reason: 'done', status: 'released' }, actor);
    released.push(seeded.id);
  }
  for (const l of listLinenroom().filter((x) => x.status === 'low').slice(0, 5)) { updateLinenroom(l.id, { status: 'ordered', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'linen.ooo_release', detail: `${released.length}`, meta: { n: released.length } });
  return { ok: true, released, overview: buildLinen() };
}

export function completeLinenHk(input = {}, actor = 'system') {
  const rows = listHkboard().filter((x) => x.status === 'queued' || x.status === 'cleaning');
  const done = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHkboard(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) done.push(next.id);
  }
  if (!done.length) {
    const seeded = createHkboard({ room: 'L1', attendant: 'ops', status: 'done' }, actor);
    done.push(seeded.id);
  }
  for (const r of listGuestrequest().filter((x) => x.status === 'open' || x.status === 'running').slice(0, 5)) { updateGuestrequest(r.id, { status: 'done', touched_by: actor }, actor); }
  for (const d of listDeepclean().filter((x) => x.status === 'due' || x.status === 'running').slice(0, 5)) { updateDeepclean(d.id, { status: 'done', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ATLAS', title: `linen hk_complete · ${done.length}`, priority: 'normal', payload: { ids: done } }, actor);
  appendAudit({ actor, action: 'linen.hk_complete', detail: `${done.length}`, meta: { n: done.length } });
  return { ok: true, done, overview: buildLinen() };
}
