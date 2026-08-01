/**
 * AŞAMA 43 — LOGOS soğuk zincir sıcaklık günlüğü.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    assetCount: ensureAssets().length,
    readingCount: readings.length,
    recentAlerts: alerts.length,
    lastAlert: alerts[0] || null,
    readings: readings.slice(0, 20),
    assets: ensureAssets(),
  };
}
