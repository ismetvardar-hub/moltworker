/**
 * AŞAMA 1095 — Helios checkpoint.
 */
import { buildAether } from './aether.js';
import { createInboundpo3, listInboundpo3, inboundpo3Summary, updateInboundpo3 } from './inboundpo3.js';
import { createAsntrack3, listAsntrack3, asntrack3Summary, updateAsntrack3 } from './asntrack3.js';
import { createCrossdock3, listCrossdock3, crossdock3Summary, updateCrossdock3 } from './crossdock3.js';
import { createSlotbook3, listSlotbook3, slotbook3Summary, updateSlotbook3 } from './slotbook3.js';
import { createFreightbill3, listFreightbill3, freightbill3Summary, updateFreightbill3 } from './freightbill3.js';
import { createExceptionlog3, listExceptionlog3, exceptionlog3Summary, updateExceptionlog3 } from './exceptionlog3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildHelios() {
  const prev = buildAether();
  const s0 = inboundpo3Summary();
  const s1 = asntrack3Summary();
  const s2 = crossdock3Summary();
  const s3 = slotbook3Summary();
  const s4 = freightbill3Summary();
  const s5 = exceptionlog3Summary();
  const flags = readCollection('helios-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Helios',
    aether: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    inboundpo3Sig: s0.planned || 0,
    asntrack3Sig: s1.idle || 0,
    crossdock3Sig: s2.open || 0,
    slotbook3Sig: s3.draft || 0,
    freightbill3Sig: s4.planned || 0,
    exceptionlog3Sig: s5.idle || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      inbound_planned: s0.planned || 0,
      asn_idle: s1.idle || 0,
      slot_draft: s3.draft || 0,
      dock_open: s2.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Inbound PO ${s0.planned || 0} · ASN Track ${s1.idle || 0}`,
      `Cross Dock ${s2.open || 0} · Slot Book ${s3.draft || 0}`,
      `Freight Bill ${s4.planned || 0} · Exception Log ${s5.idle || 0}`,
      `Helios flag ${openFlags.length} açık`,
    ],
  };
}

export function runHeliosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildHelios();
  const existing = readCollection('helios-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.inboundpo3Sig || 0) > 0 || (o.freightbill3Sig || 0) > 0)) {
    candidates.push({ key: 'inbound', level: 'alert', text: `Inbound planned ${o.inboundpo3Sig || 0} · Freight ${o.freightbill3Sig || 0}`, domain: 'inbound' });
  }
  if (force || ((o.asntrack3Sig || 0) > 0 || (o.exceptionlog3Sig || 0) > 0)) {
    candidates.push({ key: 'asn', level: 'warn', text: `ASN idle ${o.asntrack3Sig || 0} · Exception ${o.exceptionlog3Sig || 0}`, domain: 'asn' });
  }
  if (force || ((o.slotbook3Sig || 0) > 0 || (o.crossdock3Sig || 0) > 0)) {
    candidates.push({ key: 'slot', level: 'info', text: `Slot draft ${o.slotbook3Sig || 0} · Dock open ${o.crossdock3Sig || 0}`, domain: 'slot' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Helios heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('hlf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('helios-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `helios sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('hls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('helios-sweeps', sweep, 80);
  appendAudit({ actor, action: 'helios.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildHelios() };
}

export function ackHeliosFlag(input = {}, actor = 'system') {
  const list = readCollection('helios-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('helios-flags', list);
  appendAudit({ actor, action: 'helios.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildHelios() };
}

export function runHeliosInbound(input = {}, actor = 'system') {
  const rows = listInboundpo3().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateInboundpo3(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createInboundpo3({ po: 'helios', vendor: 'ops', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const f of listFreightbill3().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateFreightbill3(f.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'helios.inbound_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildHelios() };
}

export function busyHeliosAsn(input = {}, actor = 'system') {
  const rows = listAsntrack3().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAsntrack3(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createAsntrack3({ asn: 'helios', carrier: 'ops', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const e of listExceptionlog3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateExceptionlog3(e.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'helios.asn_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildHelios() };
}

export function liveHeliosSlot(input = {}, actor = 'system') {
  const rows = listSlotbook3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSlotbook3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSlotbook3({ bay: 'helios', slot: 'A1', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const d of listCrossdock3().filter((x) => x.status === 'open').slice(0, 5)) {
    updateCrossdock3(d.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `helios slot_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'helios.slot_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildHelios() };
}
