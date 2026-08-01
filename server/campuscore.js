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
  const incidents = readCollection('campus-incidents', []) || [];
  const openInc = (Array.isArray(incidents) ? incidents : []).filter((i) => (i.status || 'open') === 'open');
  const caps = readCollection('campus-capacity-rollups', []) || [];
  return {
    campus_id: CAMPUS_ID,
    title: 'LİKYA Orman Kampüsü',
    ethos: 'Sporla beslenen destinasyon — orman önce, ciro sonra.',
    zones,
    incidents: (Array.isArray(incidents) ? incidents : []).slice(0, 20),
    capacity: Array.isArray(caps) && caps[0] ? caps[0] : null,
    summary: {
      total_ha: zones.reduce((s, z) => s + (Number(z.hectares) || 0), 0),
      active: zones.filter((z) => z.status === 'active').length,
      build: zones.filter((z) => z.status === 'build').length,
      protected: zones.filter((z) => z.status === 'protected').length,
      open_incidents: openInc.length,
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
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-incidents', row, 200);
  appendAudit({ actor, action: 'campus.incident', detail: row.title, meta: { id: row.id } });
  return row;
}

/** Zon kapasite / durum geçişi (planned→build→active) */
export function transitionCampusZone(input = {}, actor = 'system') {
  const list = ensureZones();
  const idx = list.findIndex((z) => z.id === input.zone_id || z.name === input.zone_id);
  if (idx < 0) return { ok: false, error: 'Zon yok' };
  const z = list[idx];
  const order = ['planned', 'build', 'active', 'protected'];
  let status = input.status;
  if (!status) {
    const i = order.indexOf(z.status);
    status = order[Math.min(order.length - 1, i + 1)] || 'active';
    if (z.status === 'protected') status = 'protected';
  }
  if (z.kind === 'green' && status === 'active' && !input.force) {
    status = 'protected';
  }
  list[idx] = {
    ...z,
    status,
    hectares: input.hectares != null ? Number(input.hectares) : z.hectares,
    notes: input.notes || z.notes,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('campus-zones', list);
  appendAudit({
    actor,
    action: 'campus.zone_transition',
    detail: `${list[idx].id} → ${status}`,
    meta: { id: list[idx].id },
  });
  return { ok: true, zone: list[idx], overview: campusCoreOverview() };
}

export function resolveCampusIncident(input = {}, actor = 'system') {
  const list = readCollection('campus-incidents', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Incident yok' };
  let idx = list.findIndex((r) => r.id === input.id);
  if (idx < 0) idx = list.findIndex((r) => (r.status || 'open') === 'open');
  if (idx < 0) return { ok: false, error: 'Açık incident yok' };
  list[idx] = {
    ...list[idx],
    status: 'resolved',
    resolution: input.resolution || 'kapatıldı',
    resolved_at: new Date().toISOString(),
    resolved_by: actor,
  };
  writeCollection('campus-incidents', list);
  appendAudit({
    actor,
    action: 'campus.incident_resolve',
    detail: list[idx].title,
    meta: { id: list[idx].id },
  });
  return { ok: true, incident: list[idx], overview: campusCoreOverview() };
}

/** Kampüs kapasite rollup — zon ha × doluluk tahmini */
export function campusCapacityRollup(actor = 'system') {
  const zones = ensureZones();
  const stay = (() => {
    try {
      return readCollection('stay-units', []) || [];
    } catch {
      return [];
    }
  })();
  const stayUnits = Array.isArray(stay) ? stay : [];
  const occupied = stayUnits.filter((u) => u.status === 'occupied' || u.status === 'wintering').length;
  const rollup = {
    id: `ccr_${Date.now().toString(36)}`,
    total_ha: zones.reduce((s, z) => s + (Number(z.hectares) || 0), 0),
    active_zones: zones.filter((z) => z.status === 'active').length,
    protected_ha: zones.filter((z) => z.status === 'protected').reduce((s, z) => s + (Number(z.hectares) || 0), 0),
    stay_units: stayUnits.length,
    stay_occupied: occupied,
    stay_occ_pct: stayUnits.length ? Math.round((occupied / stayUnits.length) * 100) : 0,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('campus-capacity-rollups', rollup, 90);
  appendAudit({
    actor,
    action: 'campus.capacity',
    detail: `${rollup.total_ha}ha · stay %${rollup.stay_occ_pct}`,
    meta: { id: rollup.id },
  });
  return { ok: true, rollup, overview: campusCoreOverview() };
}
