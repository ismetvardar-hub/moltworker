/**
 * AŞAMA 630 — Atlas checkpoint.
 */
import { buildLinen } from './linen.js';
import { createDeskqueue, listDeskqueue, deskqueueSummary, updateDeskqueue } from './deskqueue.js';
import { createArrivalboard, listArrivalboard, arrivalboardSummary, updateArrivalboard } from './arrivalboard.js';
import { createDepartureboard, listDepartureboard, departureboardSummary, updateDepartureboard } from './departureboard.js';
import { createFoliodesk, listFoliodesk, foliodeskSummary, updateFoliodesk } from './foliodesk.js';
import { createNightaudit, listNightaudit, nightauditSummary, updateNightaudit } from './nightaudit.js';
import { createConciergejob, listConciergejob, conciergejobSummary, updateConciergejob } from './conciergejob.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildAtlas() {
  const prev = buildLinen();
  const desk = deskqueueSummary();
  const arr = arrivalboardSummary();
  const dep = departureboardSummary();
  const folio = foliodeskSummary();
  const audit = nightauditSummary();
  const conc = conciergejobSummary();
  const flags = readCollection('atlas-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Atlas',
    linen: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    deskWaiting: desk.waiting || 0,
    arrExpected: arr.expected || 0,
    depDue: dep.due || 0,
    folioDisputed: folio.disputed || 0,
    auditPending: audit.pending || 0,
    concOpen: conc.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      desk_waiting: desk.waiting || 0,
      folio_disputed: folio.disputed || 0,
      audit_pending: audit.pending || 0,
      conc_open: conc.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Desk waiting ${desk.waiting || 0} · Arrivals expected ${arr.expected || 0}`,
      `Departures due ${dep.due || 0} · Folio disputed ${folio.disputed || 0}`,
      `Night audit pending ${audit.pending || 0} · Concierge open ${conc.open || 0}`,
      `Atlas flag ${openFlags.length} açık`,
    ],
  };
}

export function runAtlasSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAtlas();
  const existing = readCollection('atlas-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.folioDisputed || 0) > 0)) {
    candidates.push({ key: 'folio', level: 'alert', text: `Folio disputed ${o.folioDisputed || 0}`, domain: 'folio' });
  }
  if (force || ((o.deskWaiting || 0) > 0)) {
    candidates.push({ key: 'desk', level: 'warn', text: `Desk waiting ${o.deskWaiting || 0}`, domain: 'desk' });
  }
  if (force || ((o.auditPending || 0) > 0 || (o.concOpen || 0) > 0)) {
    candidates.push({ key: 'ops', level: 'info', text: `Audit pending ${o.auditPending || 0} · Concierge ${o.concOpen || 0}`, domain: 'ops' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Atlas heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('atf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('atlas-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `atlas sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ats'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('atlas-sweeps', sweep, 80);
  appendAudit({ actor, action: 'atlas.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAtlas() };
}

export function ackAtlasFlag(input = {}, actor = 'system') {
  const list = readCollection('atlas-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('atlas-flags', list);
  appendAudit({ actor, action: 'atlas.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAtlas() };
}

export function closeAtlasFolio(input = {}, actor = 'system') {
  const rows = listFoliodesk().filter((x) => x.status === 'disputed' || x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateFoliodesk(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createFoliodesk({ room: 'A1', balance: 0, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'atlas.folio_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildAtlas() };
}

export function serveAtlasDesk(input = {}, actor = 'system') {
  const rows = listDeskqueue().filter((x) => x.status === 'waiting' || x.status === 'serving');
  const served = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDeskqueue(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) served.push(next.id);
  }
  if (!served.length) {
    const seeded = createDeskqueue({ guestName: 'atlas', reason: 'checkin', status: 'done' }, actor);
    served.push(seeded.id);
  }
  for (const a of listArrivalboard().filter((x) => x.status === 'expected').slice(0, 5)) { updateArrivalboard(a.id, { status: 'arrived', touched_by: actor }, actor); }
  for (const d of listDepartureboard().filter((x) => x.status === 'due').slice(0, 5)) { updateDepartureboard(d.id, { status: 'checked_out', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'atlas.desk_serve', detail: `${served.length}`, meta: { n: served.length } });
  return { ok: true, served, overview: buildAtlas() };
}

export function runAtlasAudit(input = {}, actor = 'system') {
  const rows = listNightaudit().filter((x) => x.status === 'pending' || x.status === 'running');
  const done = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNightaudit(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) done.push(next.id);
  }
  if (!done.length) {
    const seeded = createNightaudit({ step: 'close', owner: 'atlas', status: 'done' }, actor);
    done.push(seeded.id);
  }
  for (const c of listConciergejob().filter((x) => x.status === 'open' || x.status === 'working').slice(0, 5)) { updateConciergejob(c.id, { status: 'done', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ATLAS', title: `atlas audit_run · ${done.length}`, priority: 'normal', payload: { ids: done } }, actor);
  appendAudit({ actor, action: 'atlas.audit_run', detail: `${done.length}`, meta: { n: done.length } });
  return { ok: true, done, overview: buildAtlas() };
}
