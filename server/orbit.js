/**
 * AŞAMA 135 — LİKYA Orbit checkpoint.
 */
import { buildNightly } from './nightly.js';
import { createRoomstatus, listRoomstatus, roomstatusSummary, updateRoomstatus } from './roomstatus.js';
import { createKeycards, listKeycards, keycardsSummary, updateKeycards } from './keycards.js';
import { createParcels, listParcels, parcelsSummary, updateParcels } from './parcels.js';
import { createWakeups, listWakeups, wakeupsSummary, updateWakeups } from './wakeups.js';
import { createQrcheckin, listQrcheckin, qrcheckinSummary, updateQrcheckin } from './qrcheckin.js';
import { createGuestapp, listGuestapp, guestappSummary, updateGuestapp } from './guestapp.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildOrbit() {
  const prev = buildNightly();
  const rooms = roomstatusSummary();
  const keys = keycardsSummary();
  const parcels = parcelsSummary();
  const wake = wakeupsSummary();
  const qr = qrcheckinSummary();
  const app = guestappSummary();
  const flags = readCollection('orbit-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Orbit',
    nightly: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    dirtyRooms: rooms.dirty || 0,
    oooRooms: rooms.ooo || 0,
    keyQueued: keys.queued || 0,
    parcelsHeld: parcels.held || 0,
    wakeScheduled: wake.scheduled || 0,
    qrPending: qr.pending || 0,
    appFailed: app.failed || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      dirty_rooms: rooms.dirty || 0,
      key_queued: keys.queued || 0,
      qr_pending: qr.pending || 0,
      app_failed: app.failed || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Kirli oda ${rooms.dirty || 0} · OOO ${rooms.ooo || 0}`,
      `Kart kuyruk ${keys.queued || 0} · Emanet ${parcels.held || 0}`,
      `Wake-up ${wake.scheduled || 0} · QR bekleyen ${qr.pending || 0}`,
      `App push fail ${app.failed || 0}`,
      `Orbit flag ${openFlags.length} açık`,
    ],
  };
}

export function runOrbitSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildOrbit();
  const existing = readCollection('orbit-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.dirtyRooms || 0) > 0)) {
    candidates.push({ key: 'dirty_rooms', level: 'warn', text: `Kirli oda ${o.dirtyRooms || 0}`, domain: 'hk' });
  }
  if (force || ((o.qrPending || 0) > 0 || (o.keyQueued || 0) > 0)) {
    candidates.push({ key: 'arrival_queue', level: 'info', text: `QR ${o.qrPending || 0} · Key ${o.keyQueued || 0}`, domain: 'arrival' });
  }
  if (force || ((o.appFailed || 0) > 0)) {
    candidates.push({ key: 'app_failed', level: 'alert', text: `App push fail ${o.appFailed || 0}`, domain: 'guestapp' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Orbit heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('orf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('orbit-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ATLAS',
        title: `orbit sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('ors'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('orbit-sweeps', sweep, 80);
  appendAudit({ actor, action: 'orbit.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildOrbit() };
}

export function ackOrbitFlag(input = {}, actor = 'system') {
  const list = readCollection('orbit-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('orbit-flags', list);
  appendAudit({ actor, action: 'orbit.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildOrbit() };
}

export function cleanOrbitRooms(input = {}, actor = 'system') {
  const rows = listRoomstatus().filter((x) => x.status === 'dirty');
  const cleaned = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRoomstatus(row.id, { status: 'clean', touched_by: actor }, actor);
    if (next) cleaned.push(next.id);
  }
  if (!cleaned.length) {
    const seeded = createRoomstatus({ room: 'Orbit', hk: 'done', status: 'clean' }, actor);
    cleaned.push(seeded.id);
  }
  appendAudit({ actor, action: 'orbit.room_clean', detail: `${cleaned.length}`, meta: { n: cleaned.length } });
  return { ok: true, cleaned, overview: buildOrbit() };
}

export function encodeOrbitKeys(input = {}, actor = 'system') {
  const rows = listKeycards().filter((x) => x.status === 'queued');
  const encoded = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateKeycards(row.id, { status: 'encoded', touched_by: actor }, actor);
    if (next) encoded.push(next.id);
  }
  if (!encoded.length) {
    const seeded = createKeycards({ room: 'Orbit', guestName: 'ops', status: 'encoded' }, actor);
    encoded.push(seeded.id);
  }
  for (const q of listQrcheckin().filter((x) => x.status === 'pending').slice(0, 5)) { updateQrcheckin(q.id, { status: 'checked_in', touched_by: actor }, actor); }
  for (const p of listParcels().filter((x) => x.status === 'held').slice(0, 5)) { updateParcels(p.id, { status: 'delivered', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'orbit.key_encode', detail: `${encoded.length}`, meta: { n: encoded.length } });
  return { ok: true, encoded, overview: buildOrbit() };
}

export function retryOrbitGuestapp(input = {}, actor = 'system') {
  const rows = listGuestapp().filter((x) => x.status === 'failed' || x.status === 'queued');
  const sent = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateGuestapp(row.id, { status: 'sent', touched_by: actor }, actor);
    if (next) sent.push(next.id);
  }
  if (!sent.length) {
    const seeded = createGuestapp({ title: 'orbit', channel: 'push', status: 'sent' }, actor);
    sent.push(seeded.id);
  }
  for (const w of listWakeups().filter((x) => x.status === 'scheduled' || x.status === 'missed').slice(0, 5)) { updateWakeups(w.id, { status: 'done', touched_by: actor }, actor); }
  enqueueAgentJob(
    {
      agent: 'ATLAS',
      title: `orbit app_retry · ${sent.length}`,
      priority: 'normal',
      payload: { ids: sent },
    },
    actor,
  );
  appendAudit({ actor, action: 'orbit.app_retry', detail: `${sent.length}`, meta: { n: sent.length } });
  return { ok: true, sent, overview: buildOrbit() };
}
