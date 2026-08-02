/**
 * AŞAMA 43 — LOGOS soğuk zincir sıcaklık günlüğü.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

const ASSETS = [
  { id: 'cc_walkin', name: 'Walk-in soğuk oda', venueId: 'venue_kaleici', minC: 0, maxC: 4 },
  { id: 'cc_freezer', name: 'Derin dondurucu', venueId: 'venue_olympos_beach', minC: -22, maxC: -18 },
  { id: 'cc_bar', name: 'Bar buzdolabı', venueId: 'venue_olympos_beach', minC: 2, maxC: 6 },
];

function ensureAssets() {
  let list = readCollection('coldchain-assets', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('coldchain-assets', ASSETS);
    return ASSETS;
  }
  return list;
}

export function listColdAssets() {
  return ensureAssets();
}

export function listColdReadings(limit = 60) {
  return readCollection('coldchain-readings', []).slice(0, limit);
}

export function logColdReading({ assetId, tempC, note }, actor = 'system') {
  const asset = ensureAssets().find((a) => a.id === assetId) || ensureAssets()[0];
  if (!asset) return null;
  const temp = Number(tempC);
  const ok = temp >= asset.minC && temp <= asset.maxC;
  const reading = {
    id: `ccr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    assetId: asset.id,
    assetName: asset.name,
    venueId: asset.venueId,
    tempC: temp,
    minC: asset.minC,
    maxC: asset.maxC,
    ok,
    note: note || '',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('coldchain-readings', reading, 500);
  appendAudit({
    actor,
    action: ok ? 'coldchain.log' : 'coldchain.alert',
    detail: `${asset.name}: ${temp}°C ${ok ? 'OK' : 'DIŞI'}`,
    meta: { id: reading.id, assetId: asset.id, tempC: temp, ok },
  });
  return reading;
}

export function coldchainSummary() {
  const readings = listColdReadings(40);
  const alerts = readings.filter((r) => !r.ok);
  const flags = readCollection('coldchain-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const assets = ensureAssets();
  const missingReadings = assets.filter((a) => !readings.some((r) => r.assetId === a.id));
  return {
    title: 'LİKYA Soğuk Zincir Ops',
    assetCount: assets.length,
    readingCount: readings.length,
    recentAlerts: alerts.length,
    lastAlert: alerts[0] || null,
    readings: readings.slice(0, 20),
    assets,
    flags: openFlags.slice(0, 30),
    missingReadings: missingReadings.length,
    summary: {
      flags_open: openFlags.length,
      assets: assets.length,
      readings: readings.length,
      recent_alerts: alerts.length,
      missing_readings: missingReadings.length,
    },
    summaryLines: [
      `Soğuk zincir ${assets.length} probe · okuma ${readings.length} · alarm ${alerts.length}`,
      `Okumasız probe ${missingReadings.length} · flag ${openFlags.length}`,
    ],
  };
}

function addColdchainFlag(candidate, actor = 'system') {
  const existing = readCollection('coldchain-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('ccf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('coldchain-flags', list.slice(0, 200));
  return flag;
}

export function runColdchainSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = coldchainSummary();
  const created = [];
  const candidates = [];
  if (force || (overview.recentAlerts || 0) > 0) {
    candidates.push({
      key: 'coldchain_recent_breach',
      level: (overview.recentAlerts || 0) > 0 ? 'alert' : 'info',
      text: `Soğuk zincir sıcaklık breach ${overview.recentAlerts || 0}`,
      domain: 'temperature',
    });
  }
  if (force || (overview.missingReadings || 0) > 0) {
    candidates.push({
      key: 'coldchain_missing_probe_reading',
      level: (overview.missingReadings || 0) > 0 ? 'warn' : 'info',
      text: `Okumasız coldchain probe ${overview.missingReadings || 0}`,
      domain: 'probe',
    });
  }
  for (const c of candidates) {
    const flag = addColdchainFlag(c, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `coldchain sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('ccs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('coldchain-sweeps', sweep, 80);
  appendAudit({ actor, action: 'coldchain.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: coldchainSummary() };
}

export function ackColdchainFlag(input = {}, actor = 'system') {
  const list = readCollection('coldchain-flags', []) || [];
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
  writeCollection('coldchain-flags', list);
  appendAudit({ actor, action: 'coldchain.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: coldchainSummary() };
}

/** Mutator 1 — log a reading through the existing coldchain helper. */
export function recordColdchainReading(input = {}, actor = 'system') {
  const asset = ensureAssets().find((a) => a.id === input.assetId) || ensureAssets()[0];
  const tempC = input.tempC ?? (asset ? (asset.minC + asset.maxC) / 2 : 3);
  const reading = logColdReading({ assetId: asset?.id, tempC, note: input.note || 'ops coldchain reading' }, actor);
  if (!reading) return { ok: false, error: 'Geçersiz varlık/sıcaklık' };
  return { ok: true, reading, overview: coldchainSummary() };
}

/** Mutator 2 — create an out-of-band breach reading and flag it. */
export function flagColdchainBreach(input = {}, actor = 'system') {
  const asset = ensureAssets().find((a) => a.id === input.assetId) || ensureAssets()[0];
  if (!asset) return { ok: false, error: 'Probe yok' };
  const reading = logColdReading(
    {
      assetId: asset.id,
      tempC: input.tempC ?? asset.maxC + 4,
      note: input.note || 'ops breach drill',
    },
    actor,
  );
  const flag = addColdchainFlag(
    {
      key: `coldchain_manual_breach_${asset.id}`,
      level: 'alert',
      text: `${asset.name} manuel breach ${reading?.tempC}°C`,
      domain: 'temperature',
      assetId: asset.id,
      readingId: reading?.id,
    },
    actor,
  );
  appendAudit({ actor, action: 'coldchain.flag_breach', detail: asset.name, meta: { readingId: reading?.id, flagId: flag?.id } });
  return { ok: true, reading, flag, overview: coldchainSummary() };
}

/** Mutator 3 — seed a probe asset for coverage drills. */
export function seedColdchainProbe(input = {}, actor = 'system') {
  const list = ensureAssets();
  const probe = {
    id: input.id || rid('cc_probe'),
    name: input.name || 'Ops seed soğuk probe',
    venueId: input.venueId || 'venue_olympos_beach',
    minC: Number(input.minC ?? 0),
    maxC: Number(input.maxC ?? 4),
    seeded: true,
    at: new Date().toISOString(),
    actor,
  };
  writeCollection('coldchain-assets', [probe, ...list].slice(0, 100));
  appendAudit({ actor, action: 'coldchain.seed_probe', detail: probe.name, meta: { id: probe.id } });
  return { ok: true, probe, overview: coldchainSummary() };
}
