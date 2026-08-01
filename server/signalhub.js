/**
 * AŞAMA 180 — Signal Hub checkpoint.
 */
import { buildPyramid } from './pyramid.js';
import { createPowerops, listPowerops, poweropsSummary, updatePowerops } from './powerops.js';
import { createWaterops, listWaterops, wateropsSummary, updateWaterops } from './waterops.js';
import { createPoolops, listPoolops, poolopsSummary, updatePoolops } from './poolops.js';
import { createIotgates, listIotgates, iotgatesSummary, updateIotgates } from './iotgates.js';
import { createBeaconmap, listBeaconmap, beaconmapSummary, updateBeaconmap } from './beaconmap.js';
import { createChemlog, listChemlog, chemlogSummary, updateChemlog } from './chemlog.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildSignalhub() {
  const prev = buildPyramid();
  const power = poweropsSummary();
  const water = wateropsSummary();
  const pool = poolopsSummary();
  const gates = iotgatesSummary();
  const beacons = beaconmapSummary();
  const chem = chemlogSummary();
  const flags = readCollection('signalhub-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Signal Hub',
    pyramid: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    powerAlert: power.alert || 0,
    waterCritical: water.critical || 0,
    poolWarn: pool.warn || 0,
    gateJam: gates.jam || 0,
    beaconOffline: beacons.offline || 0,
    chemAlert: chem.alert || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      power_alert: power.alert || 0,
      water_critical: water.critical || 0,
      gate_jam: gates.jam || 0,
      chem_alert: chem.alert || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Güç alert ${power.alert || 0} · Su kritik ${water.critical || 0}`,
      `Havuz warn ${pool.warn || 0} · Kimyasal alert ${chem.alert || 0}`,
      `Kapı jam ${gates.jam || 0} · Beacon offline ${beacons.offline || 0}`,
      `Signalhub flag ${openFlags.length} açık`,
    ],
  };
}

export function runSignalhubSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSignalhub();
  const existing = readCollection('signalhub-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.waterCritical || 0) > 0 || (o.powerAlert || 0) > 0)) {
    candidates.push({ key: 'infra', level: 'alert', text: `Water ${o.waterCritical || 0} · Power ${o.powerAlert || 0}`, domain: 'infra' });
  }
  if (force || ((o.chemAlert || 0) > 0 || (o.poolWarn || 0) > 0)) {
    candidates.push({ key: 'pool', level: 'warn', text: `Chem ${o.chemAlert || 0} · Pool ${o.poolWarn || 0}`, domain: 'pool' });
  }
  if (force || ((o.gateJam || 0) > 0 || (o.beaconOffline || 0) > 0)) {
    candidates.push({ key: 'iot', level: 'info', text: `Gate jam ${o.gateJam || 0} · Beacon off ${o.beaconOffline || 0}`, domain: 'iot' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Signalhub heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('shf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('signalhub-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'HEPHAESTUS', title: `signalhub sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('shs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('signalhub-sweeps', sweep, 80);
  appendAudit({ actor, action: 'signalhub.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSignalhub() };
}

export function ackSignalhubFlag(input = {}, actor = 'system') {
  const list = readCollection('signalhub-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('signalhub-flags', list);
  appendAudit({ actor, action: 'signalhub.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSignalhub() };
}

export function clearSignalhubWater(input = {}, actor = 'system') {
  const rows = listWaterops().filter((x) => x.status === 'critical' || x.status === 'low');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWaterops(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createWaterops({ tank: 'S1', level: 90, status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  for (const p of listPowerops().filter((x) => x.status === 'alert').slice(0, 5)) { updatePowerops(p.id, { status: 'ok', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'signalhub.water_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildSignalhub() };
}

export function clearSignalhubChem(input = {}, actor = 'system') {
  const rows = listChemlog().filter((x) => x.status === 'alert' || x.status === 'adjust');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChemlog(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createChemlog({ pool: 'P1', chemical: 'Cl', status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  for (const p of listPoolops().filter((x) => x.status === 'warn' || x.status === 'closed').slice(0, 5)) { updatePoolops(p.id, { status: 'ok', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'signalhub.chem_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildSignalhub() };
}

export function clearSignalhubGate(input = {}, actor = 'system') {
  const rows = listIotgates().filter((x) => x.status === 'jam' || x.status === 'offline');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateIotgates(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createIotgates({ gate: 'G1', event: 'reset', status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  for (const b of listBeaconmap().filter((x) => x.status === 'offline' || x.status === 'lowbatt').slice(0, 5)) { updateBeaconmap(b.id, { status: 'online', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'HEPHAESTUS', title: `signalhub gate_clear · ${cleared.length}`, priority: 'normal', payload: { ids: cleared } }, actor);
  appendAudit({ actor, action: 'signalhub.gate_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildSignalhub() };
}
