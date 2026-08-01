/**
 * AŞAMA 465 — Hearth checkpoint.
 */
import { buildAurora } from './aurora.js';
import { createPassrail, listPassrail, passrailSummary, updatePassrail } from './passrail.js';
import { createPlateup, listPlateup, plateupSummary, updatePlateup } from './plateup.js';
import { createBarrail, listBarrail, barrailSummary, updateBarrail } from './barrail.js';
import { createRoomservice, listRoomservice, roomserviceSummary, updateRoomservice } from './roomservice.js';
import { createAllergenmap, listAllergenmap, allergenmapSummary, updateAllergenmap } from './allergenmap.js';
import { createCellarbox, listCellarbox, cellarboxSummary, updateCellarbox } from './cellarbox.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildHearth() {
  const prev = buildAurora();
  const pass = passrailSummary();
  const plate = plateupSummary();
  const bar = barrailSummary();
  const room = roomserviceSummary();
  const alg = allergenmapSummary();
  const cellar = cellarboxSummary();
  const flags = readCollection('hearth-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Hearth',
    aurora: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    passFired: pass.fired || 0,
    plateQueued: plate.queued || 0,
    barQueued: bar.queued || 0,
    roomPrep: room.prep || 0,
    allergenActive: alg.active || 0,
    cellarLow: cellar.low || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      pass_fired: pass.fired || 0,
      plate_queued: plate.queued || 0,
      allergen_active: alg.active || 0,
      cellar_low: cellar.low || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Pass fired ${pass.fired || 0} · Plate queued ${plate.queued || 0}`,
      `Bar queued ${bar.queued || 0} · Room service prep ${room.prep || 0}`,
      `Allergen active ${alg.active || 0} · Cellar low ${cellar.low || 0}`,
      `Hearth flag ${openFlags.length} açık`,
    ],
  };
}

export function runHearthSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildHearth();
  const existing = readCollection('hearth-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.passFired || 0) > 0)) {
    candidates.push({ key: 'pass_fired', level: 'warn', text: `Pass fired ${o.passFired || 0}`, domain: 'pass' });
  }
  if (force || ((o.allergenActive || 0) > 0)) {
    candidates.push({ key: 'allergen', level: 'alert', text: `Allergen active ${o.allergenActive || 0}`, domain: 'allergen' });
  }
  if (force || ((o.plateQueued || 0) > 0 || (o.cellarLow || 0) > 0)) {
    candidates.push({ key: 'kitchen_load', level: 'info', text: `Plate ${o.plateQueued || 0} · Cellar low ${o.cellarLow || 0}`, domain: 'kitchen' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Hearth heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('hhf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('hearth-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'DAZE-CREW', title: `hearth sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('hhs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('hearth-sweeps', sweep, 80);
  appendAudit({ actor, action: 'hearth.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildHearth() };
}

export function ackHearthFlag(input = {}, actor = 'system') {
  const list = readCollection('hearth-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('hearth-flags', list);
  appendAudit({ actor, action: 'hearth.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildHearth() };
}

export function runHearthPass(input = {}, actor = 'system') {
  const rows = listPassrail().filter((x) => x.status === 'fired' || x.status === 'plating');
  const run = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePassrail(row.id, { status: 'run', touched_by: actor }, actor);
    if (next) run.push(next.id);
  }
  if (!run.length) {
    const seeded = createPassrail({ ticket: 'H1', table: 'T1', status: 'run' }, actor);
    run.push(seeded.id);
  }
  appendAudit({ actor, action: 'hearth.pass_run', detail: `${run.length}`, meta: { n: run.length } });
  return { ok: true, run, overview: buildHearth() };
}

export function clearHearthAllergen(input = {}, actor = 'system') {
  const rows = listAllergenmap().filter((x) => x.status === 'active');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAllergenmap(row.id, { status: 'cleared', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createAllergenmap({ guestName: 'hearth', flag: 'nuts', status: 'cleared' }, actor);
    cleared.push(seeded.id);
  }
  for (const c of listCellarbox().filter((x) => x.status === 'low' || x.status === 'empty').slice(0, 5)) { updateCellarbox(c.id, { status: 'stocked', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'hearth.allergen_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildHearth() };
}

export function sendHearthPlate(input = {}, actor = 'system') {
  const rows = listPlateup().filter((x) => x.status === 'queued' || x.status === 'plated');
  const sent = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePlateup(row.id, { status: 'sent', touched_by: actor }, actor);
    if (next) sent.push(next.id);
  }
  if (!sent.length) {
    const seeded = createPlateup({ dish: 'hearth', covers: 2, status: 'sent' }, actor);
    sent.push(seeded.id);
  }
  for (const b of listBarrail().filter((x) => x.status === 'queued').slice(0, 5)) { updateBarrail(b.id, { status: 'served', touched_by: actor }, actor); }
  for (const r of listRoomservice().filter((x) => x.status === 'prep' || x.status === 'received').slice(0, 5)) { updateRoomservice(r.id, { status: 'delivered', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'DAZE-CREW', title: `hearth plate_send · ${sent.length}`, priority: 'normal', payload: { ids: sent } }, actor);
  appendAudit({ actor, action: 'hearth.plate_send', detail: `${sent.length}`, meta: { n: sent.length } });
  return { ok: true, sent, overview: buildHearth() };
}
