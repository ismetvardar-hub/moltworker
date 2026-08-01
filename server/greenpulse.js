/**
 * Yeşil & Arazi — ESG nabız: orman, su, enerji, karbon.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { campusCoreOverview } from './campuscore.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureMeters() {
  let list = readCollection('green-meters', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'gm_forest', kind: 'forest', label: 'Orman koruma', unit: 'ha', value: 18, target: 18, status: 'ok' },
      { id: 'gm_water', kind: 'water', label: 'Su kullanımı', unit: 'm3/gün', value: 42, target: 55, status: 'ok' },
      { id: 'gm_solar', kind: 'solar', label: 'Güneş üretimi', unit: 'kWh/gün', value: 860, target: 900, status: 'watch' },
      { id: 'gm_grid', kind: 'grid', label: 'Şebeke çekiş', unit: 'kWh/gün', value: 410, target: 350, status: 'alert' },
      { id: 'gm_waste', kind: 'waste', label: 'Atık ayrıştırma', unit: '%', value: 78, target: 85, status: 'watch' },
      { id: 'gm_co2', kind: 'carbon', label: 'Karbon yoğunluk', unit: 'kg/misafir', value: 3.2, target: 2.8, status: 'alert' },
    ];
    writeCollection('green-meters', list);
  }
  return list;
}

function scoreOf(meters) {
  let ok = 0;
  for (const m of meters) {
    if (m.kind === 'forest' || m.kind === 'solar' || m.kind === 'waste') {
      if (m.value >= m.target * 0.95) ok++;
    } else if (m.value <= m.target * 1.05) ok++;
  }
  return Math.round((ok / Math.max(1, meters.length)) * 100);
}

export function greenPulseOverview() {
  const meters = ensureMeters();
  const campus = campusCoreOverview();
  const incidents = readCollection('green-incidents', []) || [];
  const score = scoreOf(meters);
  return {
    title: 'Yeşil & Arazi ESG',
    ethos: 'Orman önce — ciro ormanın gölgesinde büyür.',
    meters,
    campus_zones: campus.zones?.filter((z) => z.kind === 'green' || z.kind === 'water') || [],
    incidents: (Array.isArray(incidents) ? incidents : []).slice(0, 20),
    summary: {
      score,
      alerts: meters.filter((m) => m.status === 'alert').length,
      watch: meters.filter((m) => m.status === 'watch').length,
      forest_ha: meters.find((m) => m.kind === 'forest')?.value ?? 0,
      solar_kwh: meters.find((m) => m.kind === 'solar')?.value ?? 0,
      water_m3: meters.find((m) => m.kind === 'water')?.value ?? 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function recordGreenMeter(input = {}, actor = 'system') {
  const meters = ensureMeters();
  const idx = meters.findIndex((m) => m.id === input.id || m.kind === input.kind);
  if (idx < 0) return { ok: false, error: 'Sayaç yok' };
  const m = meters[idx];
  const value = Number(input.value);
  if (Number.isNaN(value)) return { ok: false, error: 'value gerekli' };
  let status = 'ok';
  if (m.kind === 'forest' || m.kind === 'solar' || m.kind === 'waste') {
    if (value < m.target * 0.9) status = 'alert';
    else if (value < m.target * 0.95) status = 'watch';
  } else {
    if (value > m.target * 1.15) status = 'alert';
    else if (value > m.target * 1.05) status = 'watch';
  }
  meters[idx] = { ...m, value, status, at: new Date().toISOString(), actor };
  writeCollection('green-meters', meters);
  prependItem(
    'green-readings',
    { id: rid('gr'), meter_id: m.id, value, status, at: new Date().toISOString() },
    400,
  );
  appendAudit({ actor, action: 'green.meter', detail: `${m.kind}=${value}`, meta: { id: m.id } });
  return { ok: true, meter: meters[idx], overview: greenPulseOverview() };
}

export function addGreenIncident(input = {}, actor = 'system') {
  const row = {
    id: rid('gi'),
    title: input.title || 'ESG saha notu',
    severity: input.severity || 'info',
    kind: input.kind || 'forest',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('green-incidents', row, 200);
  appendAudit({ actor, action: 'green.incident', detail: row.title, meta: { id: row.id } });
  return { ok: true, incident: row, overview: greenPulseOverview() };
}
