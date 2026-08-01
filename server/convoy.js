/**
 * AŞAMA 600 — Convoy checkpoint.
 */
import { buildVault } from './vault.js';
import { createDispatchboard, listDispatchboard, dispatchboardSummary, updateDispatchboard } from './dispatchboard.js';
import { createFleetdesk, listFleetdesk, fleetdeskSummary, updateFleetdesk } from './fleetdesk.js';
import { createGpsping, listGpsping, gpspingSummary, updateGpsping } from './gpsping.js';
import { createValetops, listValetops, valetopsSummary, updateValetops } from './valetops.js';
import { createTransferjob, listTransferjob, transferjobSummary, updateTransferjob } from './transferjob.js';
import { createParkingbay, listParkingbay, parkingbaySummary, updateParkingbay } from './parkingbay.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildConvoy() {
  const prev = buildVault();
  const disp = dispatchboardSummary();
  const fleet = fleetdeskSummary();
  const gps = gpspingSummary();
  const valet = valetopsSummary();
  const xfer = transferjobSummary();
  const park = parkingbaySummary();
  const flags = readCollection('convoy-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Convoy',
    vault: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    dispQueued: disp.queued || 0,
    fleetService: fleet.service || 0,
    gpsOffline: gps.offline || 0,
    valetReq: valet.requested || 0,
    xferBooked: xfer.booked || 0,
    parkOcc: park.occupied || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      disp_queued: disp.queued || 0,
      fleet_service: fleet.service || 0,
      gps_offline: gps.offline || 0,
      valet_req: valet.requested || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Dispatch queued ${disp.queued || 0} · Fleet service ${fleet.service || 0}`,
      `GPS offline ${gps.offline || 0} · Valet requested ${valet.requested || 0}`,
      `Transfers booked ${xfer.booked || 0} · Parking occupied ${park.occupied || 0}`,
      `Convoy flag ${openFlags.length} açık`,
    ],
  };
}

export function runConvoySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildConvoy();
  const existing = readCollection('convoy-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.dispQueued || 0) > 0 || (o.gpsOffline || 0) > 0)) {
    candidates.push({ key: 'dispatch', level: 'alert', text: `Dispatch ${o.dispQueued || 0} · GPS offline ${o.gpsOffline || 0}`, domain: 'dispatch' });
  }
  if (force || ((o.fleetService || 0) > 0)) {
    candidates.push({ key: 'fleet', level: 'warn', text: `Fleet service ${o.fleetService || 0}`, domain: 'fleet' });
  }
  if (force || ((o.valetReq || 0) > 0 || (o.xferBooked || 0) > 0 || (o.parkOcc || 0) > 0)) {
    candidates.push({ key: 'curb', level: 'info', text: `Valet ${o.valetReq || 0} · Xfer ${o.xferBooked || 0} · Park ${o.parkOcc || 0}`, domain: 'curb' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Convoy heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('cvf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('convoy-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'HEPHAESTUS', title: `convoy sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('cvs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('convoy-sweeps', sweep, 80);
  appendAudit({ actor, action: 'convoy.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildConvoy() };
}

export function ackConvoyFlag(input = {}, actor = 'system') {
  const list = readCollection('convoy-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('convoy-flags', list);
  appendAudit({ actor, action: 'convoy.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildConvoy() };
}

export function clearConvoyDispatch(input = {}, actor = 'system') {
  const rows = listDispatchboard().filter((x) => x.status === 'queued' || x.status === 'dispatched');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDispatchboard(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createDispatchboard({ job: 'convoy', vehicle: 'Van-1', status: 'closed' }, actor);
    cleared.push(seeded.id);
  }
  for (const g of listGpsping().filter((x) => x.status === 'offline' || x.status === 'stale').slice(0, 5)) {
    updateGpsping(g.id, { status: 'fresh', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'convoy.dispatch_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildConvoy() };
}

export function readyConvoyFleet(input = {}, actor = 'system') {
  const rows = listFleetdesk().filter((x) => x.status === 'service');
  const readied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateFleetdesk(row.id, { status: 'ready', touched_by: actor }, actor);
    if (next) readied.push(next.id);
  }
  if (!readied.length) {
    const seeded = createFleetdesk({ unit: 'CV-1', status: 'ready' }, actor);
    readied.push(seeded.id);
  }
  appendAudit({ actor, action: 'convoy.fleet_ready', detail: `${readied.length}`, meta: { n: readied.length } });
  return { ok: true, readied, overview: buildConvoy() };
}

export function freeConvoyCurb(input = {}, actor = 'system') {
  const rows = listValetops().filter((x) => x.status === 'requested');
  const freed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateValetops(row.id, { status: 'delivered', touched_by: actor }, actor);
    if (next) freed.push(next.id);
  }
  if (!freed.length) {
    const seeded = createValetops({ plate: 'CV01', status: 'delivered' }, actor);
    freed.push(seeded.id);
  }
  for (const t of listTransferjob().filter((x) => x.status === 'booked' || x.status === 'assigned').slice(0, 5)) {
    updateTransferjob(t.id, { status: 'done', touched_by: actor }, actor);
  }
  for (const p of listParkingbay().filter((x) => x.status === 'occupied' || x.status === 'reserved').slice(0, 5)) {
    updateParkingbay(p.id, { status: 'free', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'HEPHAESTUS', title: `convoy curb_free · ${freed.length}`, priority: 'normal', payload: { ids: freed } }, actor);
  appendAudit({ actor, action: 'convoy.curb_free', detail: `${freed.length}`, meta: { n: freed.length } });
  return { ok: true, freed, overview: buildConvoy() };
}
