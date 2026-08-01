/**
 * AŞAMA 495 — Citadel checkpoint.
 */
import { buildSanctum } from './sanctum.js';
import { createPlantroom, listPlantroom, plantroomSummary, updatePlantroom } from './plantroom.js';
import { createHvacloop, hvacloopSummary, listHvacloop, updateHvacloop } from './hvacloop.js';
import { createPowergrid, listPowergrid, powergridSummary, updatePowergrid } from './powergrid.js';
import { createWorkorder, listWorkorder, updateWorkorder, workorderSummary } from './workorder.js';
import { createSpareparts, listSpareparts, sparepartsSummary, updateSpareparts } from './spareparts.js';
import { createEstatescan, estatescanSummary, listEstatescan, updateEstatescan } from './estatescan.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildCitadel() {
  const prev = buildSanctum();
  const plant = plantroomSummary();
  const hvac = hvacloopSummary();
  const power = powergridSummary();
  const wo = workorderSummary();
  const spare = sparepartsSummary();
  const scan = estatescanSummary();
  const flags = readCollection('citadel-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Citadel',
    sanctum: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    plantCritical: plant.critical || 0,
    hvacFault: hvac.fault || 0,
    powerOutage: power.outage || 0,
    woOpen: wo.open || 0,
    spareLow: spare.low || 0,
    scanRed: scan.red || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      plant_critical: plant.critical || 0,
      hvac_fault: hvac.fault || 0,
      wo_open: wo.open || 0,
      power_outage: power.outage || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Plant critical ${plant.critical || 0} · HVAC fault ${hvac.fault || 0}`,
      `Power outage ${power.outage || 0} · Work orders open ${wo.open || 0}`,
      `Spare parts low ${spare.low || 0} · Estate scan red ${scan.red || 0}`,
      `Citadel flag ${openFlags.length} açık`,
    ],
  };
}

export function runCitadelSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCitadel();
  const existing = readCollection('citadel-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.plantCritical || 0) > 0) {
    candidates.push({ key: 'plant_critical', level: 'alert', text: `Plant critical ${o.plantCritical || 0}`, domain: 'plant' });
  }
  if (force || (o.hvacFault || 0) > 0 || (o.powerOutage || 0) > 0) {
    candidates.push({
      key: 'facilities_fault',
      level: 'alert',
      text: `HVAC fault ${o.hvacFault || 0} · Power outage ${o.powerOutage || 0}`,
      domain: 'facilities',
    });
  }
  if (force || (o.woOpen || 0) > 0) {
    candidates.push({ key: 'wo_open', level: 'warn', text: `Work orders open ${o.woOpen || 0}`, domain: 'workorder' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Citadel heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ctf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('citadel-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `citadel sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('citadel-sweeps', sweep, 80);
  appendAudit({ actor, action: 'citadel.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCitadel() };
}

export function ackCitadelFlag(input = {}, actor = 'system') {
  const list = readCollection('citadel-flags', []) || [];
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
  writeCollection('citadel-flags', list);
  appendAudit({ actor, action: 'citadel.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCitadel() };
}

export function clearCitadelPlant(input = {}, actor = 'system') {
  const rows = listPlantroom().filter((x) => x.status === 'critical' || x.status === 'attention');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePlantroom(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createPlantroom({ room: 'Citadel', check: 'clear', status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'citadel.plant_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildCitadel() };
}

export function clearCitadelHvac(input = {}, actor = 'system') {
  const rows = listHvacloop().filter((x) => x.status === 'fault');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateHvacloop(row.id, { status: 'auto', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  // also restore power outages
  for (const p of listPowergrid().filter((x) => x.status === 'outage').slice(0, 10)) {
    updatePowergrid(p.id, { status: 'grid', touched_by: actor }, actor);
  }
  if (!cleared.length) {
    const seeded = createHvacloop({ loop: 'Citadel', setpoint: 22, status: 'auto' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'citadel.hvac_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildCitadel() };
}

export function closeCitadelWorkorder(input = {}, actor = 'system') {
  const rows = listWorkorder().filter((x) => x.status === 'open' || x.status === 'assigned');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWorkorder(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createWorkorder({ asset: 'Citadel', task: 'close-seed', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  // spare + estate side effects
  for (const s of listSpareparts().filter((x) => x.status === 'low').slice(0, 5)) {
    updateSpareparts(s.id, { status: 'ordered', touched_by: actor }, actor);
  }
  for (const e of listEstatescan().filter((x) => x.status === 'red').slice(0, 5)) {
    updateEstatescan(e.id, { status: 'green', touched_by: actor }, actor);
  }
  enqueueAgentJob(
    {
      agent: 'HEPHAESTUS',
      title: `citadel WO close · ${closed.length}`,
      priority: 'normal',
      payload: { ids: closed },
    },
    actor,
  );
  appendAudit({ actor, action: 'citadel.wo_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildCitadel() };
}
