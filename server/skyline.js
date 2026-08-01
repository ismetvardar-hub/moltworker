/**
 * AŞAMA 195 — Skyline checkpoint.
 */
import { buildSignalhub } from './signalhub.js';
import { createYacht, listYacht, yachtSummary, updateYacht } from './yacht.js';
import { createJetski, listJetski, jetskiSummary, updateJetski } from './jetski.js';
import { createHelipad, listHelipad, helipadSummary, updateHelipad } from './helipad.js';
import { createDjbooth, listDjbooth, djboothSummary, updateDjbooth } from './djbooth.js';
import { createEscaperoom, listEscaperoom, escaperoomSummary, updateEscaperoom } from './escaperoom.js';
import { createSoundcheck, listSoundcheck, soundcheckSummary, updateSoundcheck } from './soundcheck.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildSkyline() {
  const prev = buildSignalhub();
  const yacht = yachtSummary();
  const jet = jetskiSummary();
  const heli = helipadSummary();
  const dj = djboothSummary();
  const escape = escaperoomSummary();
  const sound = soundcheckSummary();
  const flags = readCollection('skyline-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Skyline',
    signalhub: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    yachtChartered: yacht.chartered || 0,
    jetskiRented: jet.rented || 0,
    helipadBooked: heli.booked || 0,
    djLive: dj.live || 0,
    escapeRunning: escape.running || 0,
    soundFail: sound.fail || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      sound_fail: sound.fail || 0,
      dj_live: dj.live || 0,
      escape_running: escape.running || 0,
      helipad_booked: heli.booked || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Yat charter ${yacht.chartered || 0} · Jet ski kirada ${jet.rented || 0}`,
      `Helipad dolu ${heli.booked || 0} · DJ live ${dj.live || 0}`,
      `Escape running ${escape.running || 0} · Sound fail ${sound.fail || 0}`,
      `Skyline flag ${openFlags.length} açık`,
    ],
  };
}

export function runSkylineSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSkyline();
  const existing = readCollection('skyline-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.soundFail || 0) > 0)) {
    candidates.push({ key: 'sound_fail', level: 'alert', text: `Sound fail ${o.soundFail || 0}`, domain: 'sound' });
  }
  if (force || ((o.escapeRunning || 0) > 0 || (o.djLive || 0) > 0)) {
    candidates.push({ key: 'ent', level: 'info', text: `Escape ${o.escapeRunning || 0} · DJ ${o.djLive || 0}`, domain: 'ent' });
  }
  if (force || ((o.helipadBooked || 0) > 0)) {
    candidates.push({ key: 'heli', level: 'warn', text: `Helipad booked ${o.helipadBooked || 0}`, domain: 'heli' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Skyline heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('skf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('skyline-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'AURA', title: `skyline sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('sks'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('skyline-sweeps', sweep, 80);
  appendAudit({ actor, action: 'skyline.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSkyline() };
}

export function ackSkylineFlag(input = {}, actor = 'system') {
  const list = readCollection('skyline-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('skyline-flags', list);
  appendAudit({ actor, action: 'skyline.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSkyline() };
}

export function passSkylineSound(input = {}, actor = 'system') {
  const rows = listSoundcheck().filter((x) => x.status === 'fail' || x.status === 'pending');
  const passed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSoundcheck(row.id, { status: 'pass', touched_by: actor }, actor);
    if (next) passed.push(next.id);
  }
  if (!passed.length) {
    const seeded = createSoundcheck({ stage: 'main', note: 'ok', status: 'pass' }, actor);
    passed.push(seeded.id);
  }
  appendAudit({ actor, action: 'skyline.sound_pass', detail: `${passed.length}`, meta: { n: passed.length } });
  return { ok: true, passed, overview: buildSkyline() };
}

export function endSkylineEscape(input = {}, actor = 'system') {
  const rows = listEscaperoom().filter((x) => x.status === 'running' || x.status === 'booked');
  const ended = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEscaperoom(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) ended.push(next.id);
  }
  if (!ended.length) {
    const seeded = createEscaperoom({ room: 'E1', pax: 4, status: 'done' }, actor);
    ended.push(seeded.id);
  }
  for (const d of listDjbooth().filter((x) => x.status === 'live' || x.status === 'scheduled').slice(0, 5)) { updateDjbooth(d.id, { status: 'done', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'skyline.escape_end', detail: `${ended.length}`, meta: { n: ended.length } });
  return { ok: true, ended, overview: buildSkyline() };
}

export function serviceSkylineJet(input = {}, actor = 'system') {
  const rows = listJetski().filter((x) => x.status === 'rented' || x.status === 'service');
  const serviced = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateJetski(row.id, { status: 'available', touched_by: actor }, actor);
    if (next) serviced.push(next.id);
  }
  if (!serviced.length) {
    const seeded = createJetski({ unit: 'J1', guestName: 'sky', status: 'available' }, actor);
    serviced.push(seeded.id);
  }
  for (const h of listHelipad().filter((x) => x.status === 'booked').slice(0, 5)) { updateHelipad(h.id, { status: 'open', touched_by: actor }, actor); }
  for (const y of listYacht().filter((x) => x.status === 'chartered' || x.status === 'inquiry').slice(0, 5)) { updateYacht(y.id, { status: 'docked', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'AURA', title: `skyline jet_service · ${serviced.length}`, priority: 'normal', payload: { ids: serviced } }, actor);
  appendAudit({ actor, action: 'skyline.jet_service', detail: `${serviced.length}`, meta: { n: serviced.length } });
  return { ok: true, serviced, overview: buildSkyline() };
}
