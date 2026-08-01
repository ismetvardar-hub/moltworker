/**
 * AŞAMA 47 — Enerji / sayaç okumaları.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    meters: ensureMeters(),
    readingCount: readings.length,
    readings,
  };
}
