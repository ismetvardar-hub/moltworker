/**
 * AŞAMA 47 — Enerji / sayaç okumaları.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

const METERS = [
  { id: 'mtr_beach_kwh', name: 'Sahil elektrik', unit: 'kWh', venueId: 'venue_olympos_beach' },
  { id: 'mtr_kale_water', name: 'Kaleiçi su', unit: 'm³', venueId: 'venue_kaleici' },
  { id: 'mtr_beach_gas', name: 'Sahil gaz', unit: 'm³', venueId: 'venue_olympos_beach' },
];

function ensureMeters() {
  let list = readCollection('energy-meters', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('energy-meters', METERS);
    return METERS;
  }
  return list;
}

export function listMeters() {
  return ensureMeters();
}

export function listEnergyReadings(limit = 50) {
  return readCollection('energy-readings', []).slice(0, limit);
}

export function logEnergyReading({ meterId, value, note }, actor = 'system') {
  const meter = ensureMeters().find((m) => m.id === meterId) || ensureMeters()[0];
  if (!meter) return null;
  const reading = {
    id: `enr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    meterId: meter.id,
    meterName: meter.name,
    venueId: meter.venueId,
    unit: meter.unit,
    value: Number(value) || 0,
    note: note || '',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('energy-readings', reading, 500);
  appendAudit({
    actor,
    action: 'energy.log',
    detail: `${meter.name}: ${reading.value} ${meter.unit}`,
    meta: { id: reading.id, meterId: meter.id },
  });
  return reading;
}

export function energySummary() {
  const readings = listEnergyReadings(30);
  const flags = readCollection('energy-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const meters = ensureMeters();
  const spikes = readings.filter((r, idx) => {
    const prev = readings.slice(idx + 1).find((x) => x.meterId === r.meterId);
    if (!prev) return false;
    const delta = Number(r.value) - Number(prev.value);
    return delta >= Number(r.spikeThreshold || 500);
  });
  const missingReadings = meters.filter((m) => !readings.some((r) => r.meterId === m.id));
  return {
    title: 'LİKYA Enerji Ops',
    meters,
    readingCount: readings.length,
    readings,
    spikes: spikes.length,
    missingReadings: missingReadings.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      meters: meters.length,
      readings: readings.length,
      spikes: spikes.length,
      missing_readings: missingReadings.length,
    },
    summaryLines: [
      `Enerji ${meters.length} sayaç · okuma ${readings.length} · spike ${spikes.length}`,
      `Okumasız sayaç ${missingReadings.length} · flag ${openFlags.length}`,
    ],
  };
}

function addEnergyFlag(candidate, actor = 'system') {
  const existing = readCollection('energy-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('enf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('energy-flags', list.slice(0, 200));
  return flag;
}

export function runEnergySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = energySummary();
  const created = [];
  const candidates = [];
  if (force || (overview.spikes || 0) > 0) {
    candidates.push({
      key: 'energy_meter_spike',
      level: (overview.spikes || 0) > 0 ? 'alert' : 'info',
      text: `Enerji sayaç spike ${overview.spikes || 0}`,
      domain: 'consumption',
    });
  }
  if (force || (overview.missingReadings || 0) > 0) {
    candidates.push({
      key: 'energy_missing_reading',
      level: (overview.missingReadings || 0) > 0 ? 'warn' : 'info',
      text: `Okumasız enerji sayacı ${overview.missingReadings || 0}`,
      domain: 'meter',
    });
  }
  for (const c of candidates) {
    const flag = addEnergyFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `energy sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('ens'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('energy-sweeps', sweep, 80);
  appendAudit({ actor, action: 'energy.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: energySummary() };
}

export function ackEnergyFlag(input = {}, actor = 'system') {
  const list = readCollection('energy-flags', []) || [];
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
  writeCollection('energy-flags', list);
  appendAudit({ actor, action: 'energy.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: energySummary() };
}

/** Mutator 1 — log a meter reading through the existing energy helper. */
export function recordEnergyReading(input = {}, actor = 'system') {
  const meter = ensureMeters().find((m) => m.id === input.meterId) || ensureMeters()[0];
  const reading = logEnergyReading(
    {
      meterId: meter?.id,
      value: Number(input.value ?? 100),
      note: input.note || 'ops energy reading',
    },
    actor,
  );
  if (!reading) return { ok: false, error: 'Geçersiz sayaç' };
  return { ok: true, reading, overview: energySummary() };
}

/** Mutator 2 — create a spike reading and flag it. */
export function flagEnergySpike(input = {}, actor = 'system') {
  const meter = ensureMeters().find((m) => m.id === input.meterId) || ensureMeters()[0];
  if (!meter) return { ok: false, error: 'Sayaç yok' };
  const existing = listEnergyReadings(100).find((r) => r.meterId === meter.id);
  const base = existing ? Number(existing.value) : 100;
  const reading = logEnergyReading(
    {
      meterId: meter.id,
      value: Number(input.value ?? base + 750),
      note: input.note || 'ops spike drill',
    },
    actor,
  );
  const flag = addEnergyFlag(
    {
      key: `energy_manual_spike_${meter.id}`,
      level: 'alert',
      text: `${meter.name} spike ${reading?.value} ${meter.unit}`,
      domain: 'consumption',
      meterId: meter.id,
      readingId: reading?.id,
    },
    actor,
  );
  appendAudit({ actor, action: 'energy.flag_spike', detail: meter.name, meta: { readingId: reading?.id, flagId: flag?.id } });
  return { ok: true, reading, flag, overview: energySummary() };
}

/** Mutator 3 — seed a meter for coverage drills. */
export function seedEnergyMeter(input = {}, actor = 'system') {
  const list = ensureMeters();
  const meter = {
    id: input.id || rid('mtr_ops'),
    name: input.name || 'Ops seed sayaç',
    unit: input.unit || 'kWh',
    venueId: input.venueId || 'venue_olympos_beach',
    seeded: true,
    at: new Date().toISOString(),
    actor,
  };
  writeCollection('energy-meters', [meter, ...list].slice(0, 100));
  appendAudit({ actor, action: 'energy.seed_meter', detail: meter.name, meta: { id: meter.id } });
  return { ok: true, meter, overview: energySummary() };
}
