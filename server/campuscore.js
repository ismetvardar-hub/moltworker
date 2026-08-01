/**
 * Adım 2 — Kampüs omurga: arazi zonları.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

const CAMPUS_ID = 'likya_antalya_forest_campus';

const DEFAULT_ZONES = [
  { id: 'z_sport', name: 'Spor & Extreme', kind: 'sport', hectares: 12, status: 'active', notes: 'Açık/kapalı salon, tırmanış, dere' },
  { id: 'z_water', name: 'Dere & Su Sporları', kind: 'water', hectares: 4, status: 'active', notes: 'Kürek, kano, SUP' },
  { id: 'z_glamp', name: 'Glamping / Çadır', kind: 'stay', hectares: 6, status: 'active', notes: 'Çadır + glamping' },
  { id: 'z_caravan', name: 'Karavan Kışlama', kind: 'stay', hectares: 5, status: 'build', notes: 'Kışlama + hook-up' },
  { id: 'z_bungalow', name: 'Bungalow', kind: 'stay', hectares: 7, status: 'active', notes: 'Aile bungalow' },
  { id: 'z_mall', name: 'Açık AVM', kind: 'mall', hectares: 3, status: 'active', notes: 'Market, F&B, hediyelik' },
  { id: 'z_culture', name: 'Kültür & Sahne', kind: 'culture', hectares: 2, status: 'planned', notes: 'Müzik, tiyatro' },
  { id: 'z_family', name: 'Aile & Çocuk', kind: 'family', hectares: 3, status: 'active', notes: 'Kamp, emanet, yaz okulu' },
  { id: 'z_forest', name: 'Orman Koruma', kind: 'green', hectares: 18, status: 'protected', notes: 'Dokunulmaz yeşil' },
];

function ensureZones() {
  let list = readCollection('campus-zones', null);
  if (!Array.isArray(list) || !list.length) {
    list = DEFAULT_ZONES.map((z) => ({ ...z, campus_id: CAMPUS_ID, at: new Date().toISOString() }));
    writeCollection('campus-zones', list);
  }
  return list;
}

export function campusCoreOverview() {
  const zones = ensureZones();
  const byKind = {};
  for (const z of zones) byKind[z.kind] = (byKind[z.kind] || 0) + 1;
  return {
    campus_id: CAMPUS_ID,
    title: 'LİKYA Orman Kampüsü',
    ethos: 'Sporla beslenen destinasyon — orman önce, ciro sonra.',
    zones,
    summary: {
      total_ha: zones.reduce((s, z) => s + (Number(z.hectares) || 0), 0),
      active: zones.filter((z) => z.status === 'active').length,
      build: zones.filter((z) => z.status === 'build').length,
      protected: zones.filter((z) => z.status === 'protected').length,
      byKind,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function updateCampusZone(id, patch = {}, actor = 'system') {
  const list = ensureZones();
  const idx = list.findIndex((z) => z.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('campus-zones', list);
  appendAudit({ actor, action: 'campus.zone', detail: `${id} → ${list[idx].status}`, meta: { id } });
  return list[idx];
}

export function addCampusIncident(input = {}, actor = 'system') {
  const row = {
    id: `ci_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    campus_id: CAMPUS_ID,
    zone_id: input.zone_id || 'z_sport',
    title: input.title || 'Saha notu',
    severity: input.severity || 'info',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-incidents', row, 200);
  appendAudit({ actor, action: 'campus.incident', detail: row.title, meta: { id: row.id } });
  return row;
}
