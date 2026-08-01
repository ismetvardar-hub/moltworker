/**
 * AŞAMA 945 — Artery2 checkpoint.
 */
import { buildAlliance3 } from './alliance3.js';
import { createInboundpo2, listInboundpo2, inboundpo2Summary, updateInboundpo2 } from './inboundpo2.js';
import { createAsntrack2, listAsntrack2, asntrack2Summary, updateAsntrack2 } from './asntrack2.js';
import { createCrossdock2, listCrossdock2, crossdock2Summary, updateCrossdock2 } from './crossdock2.js';
import { createSlotbook2, listSlotbook2, slotbook2Summary, updateSlotbook2 } from './slotbook2.js';
import { createFreightbill2, listFreightbill2, freightbill2Summary, updateFreightbill2 } from './freightbill2.js';
import { createExceptionlog2, listExceptionlog2, exceptionlog2Summary, updateExceptionlog2 } from './exceptionlog2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildArtery2() {
  const prev = buildAlliance3();
  const s0 = inboundpo2Summary();
  const s1 = asntrack2Summary();
  const s2 = crossdock2Summary();
  const s3 = slotbook2Summary();
  const s4 = freightbill2Summary();
  const s5 = exceptionlog2Summary();
  const flags = readCollection('artery2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Artery2',
    alliance3: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    inboundpo2Sig: s0.planned || 0,
    asntrack2Sig: s1.idle || 0,
    crossdock2Sig: s2.open || 0,
    slotbook2Sig: s3.draft || 0,
    freightbill2Sig: s4.planned || 0,
    exceptionlog2Sig: s5.idle || 0,
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
      `Artery2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runArtery2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildArtery2();
  const existing = readCollection('artery2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.crossdock2Sig || 0) > 0 || (o.slotbook2Sig || 0) > 0)) {
    candidates.push({ key: 'dock', level: 'alert', text: `Crossdock open ${o.crossdock2Sig || 0} · Slot ${o.slotbook2Sig || 0}`, domain: 'dock' });
  }
  if (force || ((o.inboundpo2Sig || 0) > 0 || (o.freightbill2Sig || 0) > 0)) {
    candidates.push({ key: 'inbound', level: 'warn', text: `Inbound planned ${o.inboundpo2Sig || 0} · Freight ${o.freightbill2Sig || 0}`, domain: 'inbound' });
  }
  if (force || ((o.asntrack2Sig || 0) > 0 || (o.exceptionlog2Sig || 0) > 0)) {
    candidates.push({ key: 'asn', level: 'info', text: `ASN idle ${o.asntrack2Sig || 0} · Exception ${o.exceptionlog2Sig || 0}`, domain: 'asn' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Artery2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ar2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('artery2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `artery2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('ar2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('artery2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'artery2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildArtery2() };
}

export function ackArtery2Flag(input = {}, actor = 'system') {
  const list = readCollection('artery2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('artery2-flags', list);
  appendAudit({ actor, action: 'artery2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildArtery2() };
}

export function runArtery2Inbound(input = {}, actor = 'system') {
  const rows = listInboundpo2().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateInboundpo2(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createInboundpo2({ po: 'artery2', vendor: 'ops', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const f of listFreightbill2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateFreightbill2(f.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'artery2.inbound_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildArtery2() };
}

export function busyArtery2Asn(input = {}, actor = 'system') {
  const rows = listAsntrack2().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAsntrack2(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createAsntrack2({ asn: 'artery2', carrier: 'ops', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const e of listExceptionlog2().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateExceptionlog2(e.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'artery2.asn_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildArtery2() };
}

export function closeArtery2Dock(input = {}, actor = 'system') {
  const rows = listCrossdock2().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCrossdock2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createCrossdock2({ from: 'artery2', to: 'yard', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const s of listSlotbook2().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateSlotbook2(s.id, { status: 'live', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `artery2 dock_close · ${closed.length}`, priority: 'normal', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'artery2.dock_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildArtery2() };
}
