/**
 * AŞAMA 735 — Artery checkpoint.
 */
import { buildAlliance2 } from './alliance2.js';
import { createInboundpo, listInboundpo, inboundpoSummary, updateInboundpo } from './inboundpo.js';
import { createAsntrack, listAsntrack, asntrackSummary, updateAsntrack } from './asntrack.js';
import { createCrossdock, listCrossdock, crossdockSummary, updateCrossdock } from './crossdock.js';
import { createSlotbook, listSlotbook, slotbookSummary, updateSlotbook } from './slotbook.js';
import { createFreightbill, listFreightbill, freightbillSummary, updateFreightbill } from './freightbill.js';
import { createExceptionlog, listExceptionlog, exceptionlogSummary, updateExceptionlog } from './exceptionlog.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildArtery() {
  const prev = buildAlliance2();
  const s0 = inboundpoSummary();
  const s1 = asntrackSummary();
  const s2 = crossdockSummary();
  const s3 = slotbookSummary();
  const s4 = freightbillSummary();
  const s5 = exceptionlogSummary();
  const flags = readCollection('artery-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Artery',
    alliance2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    inboundpoSig: s0.planned || 0,
    asntrackSig: s1.idle || 0,
    crossdockSig: s2.open || 0,
    slotbookSig: s3.draft || 0,
    freightbillSig: s4.planned || 0,
    exceptionlogSig: s5.idle || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      inbound_planned: s0.planned || 0,
      asn_idle: s1.idle || 0,
      dock_open: s2.open || 0,
      freight_planned: s4.planned || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Inbound PO ${s0.planned || 0} · ASN Track ${s1.idle || 0}`,
      `Cross Dock ${s2.open || 0} · Slot Book ${s3.draft || 0}`,
      `Freight Bill ${s4.planned || 0} · Exception Log ${s5.idle || 0}`,
      `Artery flag ${openFlags.length} açık`,
    ],
  };
}

export function runArterySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildArtery();
  const existing = readCollection('artery-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.crossdockSig || 0) > 0 || (o.slotbookSig || 0) > 0)) {
    candidates.push({ key: 'dock', level: 'alert', text: `Crossdock open ${o.crossdockSig || 0} · Slot ${o.slotbookSig || 0}`, domain: 'dock' });
  }
  if (force || ((o.inboundpoSig || 0) > 0 || (o.freightbillSig || 0) > 0)) {
    candidates.push({ key: 'inbound', level: 'warn', text: `Inbound planned ${o.inboundpoSig || 0} · Freight ${o.freightbillSig || 0}`, domain: 'inbound' });
  }
  if (force || ((o.asntrackSig || 0) > 0 || (o.exceptionlogSig || 0) > 0)) {
    candidates.push({ key: 'asn', level: 'info', text: `ASN idle ${o.asntrackSig || 0} · Exception ${o.exceptionlogSig || 0}`, domain: 'asn' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Artery heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('artf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('artery-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `artery sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('arts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('artery-sweeps', sweep, 80);
  appendAudit({ actor, action: 'artery.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildArtery() };
}

export function ackArteryFlag(input = {}, actor = 'system') {
  const list = readCollection('artery-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('artery-flags', list);
  appendAudit({ actor, action: 'artery.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildArtery() };
}

export function runArteryInbound(input = {}, actor = 'system') {
  const rows = listInboundpo().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateInboundpo(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createInboundpo({ po: 'artery', vendor: 'ops', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const f of listFreightbill().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateFreightbill(f.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'artery.inbound_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildArtery() };
}

export function busyArteryAsn(input = {}, actor = 'system') {
  const rows = listAsntrack().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAsntrack(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createAsntrack({ asn: 'artery', carrier: 'ops', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const e of listExceptionlog().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateExceptionlog(e.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'artery.asn_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildArtery() };
}

export function closeArteryDock(input = {}, actor = 'system') {
  const rows = listCrossdock().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCrossdock(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createCrossdock({ from: 'artery', to: 'yard', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const s of listSlotbook().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateSlotbook(s.id, { status: 'live', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `artery dock_close · ${closed.length}`, priority: 'normal', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'artery.dock_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildArtery() };
}
