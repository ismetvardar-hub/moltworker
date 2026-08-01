/**
 * AŞAMA 16 — Marka / kiracı katmanı (holding altında ürünler).
 */

import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

const DEFAULT_BRANDS = [
  {
    id: 'brand_olympospass',
    name: 'OlymposPass',
    shortName: 'OLP',
    color: '#e8a020',
    modules: [
      'olympospass',
      'nexus',
      'venues',
      'field',
      'inventory',
      'shifts',
      'reservations',
      'loyalty',
      'feedback',
      'consent',
      'announcements',
      'lostfound',
      'checklists',
      'giftcards',
      'eventcal',
      'wifi',
      'passstock',
      'lockers',
      'kidsclub',
      'beachbeds',
      'transfers',
      'lounge',
      'shuttle',
      'partners',
      'concierge',
      'tours',
      'marina',
      'hammam',
      'towels',
      'bands',
      'folio',
    ],
    venueIds: ['venue_olympos_beach', 'venue_kaleici', 'venue_phaseelis'],
    status: 'active',
  },
  {
    id: 'brand_daze',
    name: 'Daze',
    shortName: 'DAZE',
    color: '#38bdf8',
    modules: [
      'chef',
      'crew',
      'vision',
      'field',
      'jobs',
      'inventory',
      'shifts',
      'reservations',
      'loyalty',
      'suppliers',
      'feedback',
      'recipes',
      'announcements',
      'checklists',
      'lostfound',
      'tips',
      'maintenance',
      'brief',
      'menu',
      'campaigns',
      'coldchain',
      'handover',
      'cash',
      'assets',
      'energy',
      'training',
      'valet',
      'music',
      'waste',
      'seating',
      'waitlist',
      'complaints',
      'kudos',
      'hours',
      'weather',
      'readiness',
      'digest',
      'kds',
      'pulse',
      'content',
      'wifi',
      'laundry',
      'cleaning',
      'delivery',
      'giftcards',
      'eventcal',
      'vendorscore',
      'allergens',
      'winecellar',
      'kds',
      'badgeprint',
      'meetingrooms',
      'mysteryshop',
      'minibar',
      'haccp',
      'flash',
      'banquet',
    ],
    venueIds: ['venue_olympos_beach', 'venue_kaleici'],
    status: 'active',
  },
  {
    id: 'brand_likya',
    name: 'LİKYA Holding',
    shortName: 'LİKYA',
    color: '#ffd98a',
    modules: [
      'komuta',
      'hub',
      'ajanlar',
      'ollama',
      'reports',
      'metrics',
      'ops',
      'settings',
      'inventory',
      'shifts',
      'reservations',
      'loyalty',
      'incidents',
      'suppliers',
      'feedback',
      'exports',
      'consent',
      'announcements',
      'recipes',
      'checklists',
      'lostfound',
      'tips',
      'audit',
      'maintenance',
      'brief',
      'menu',
      'campaigns',
      'i18n',
      'coldchain',
      'handover',
      'cash',
      'assets',
      'energy',
      'training',
      'valet',
      'music',
      'documents',
      'vendorscore',
      'waste',
      'seating',
      'waitlist',
      'complaints',
      'kudos',
      'hours',
      'weather',
      'readiness',
      'spa',
      'eventcal',
      'giftcards',
      'delivery',
      'cleaning',
      'laundry',
      'wifi',
      'content',
      'pulse',
      'budget',
      'contracts',
      'passstock',
      'kds',
      'emergency',
      'digest',
      'lockers',
      'kidsclub',
      'beachbeds',
      'transfers',
      'badgeprint',
      'meetingrooms',
      'mediakit',
      'sustain',
      'allergens',
      'winecellar',
      'lounge',
      'shuttle',
      'partners',
      'mysteryshop',
      'boardpack',
      'concierge',
      'minibar',
      'folio',
      'banquet',
      'tours',
      'marina',
      'hammam',
      'towels',
      'bands',
      'haccp',
      'patrol',
      'fleet',
      'payroll',
      'flash',
      'warroom',
      'upsell',
      'otareviews',
      'groups',
      'vipnotes',
      'photoshoot',
      'dive',
      'bikerent',
      'cinema',
      'retail',
      'bakery',
      'breakfast',
      'lateout',
      'amenities',
      'nightlog',
      'nightly',
      'keycards',
      'roomstatus',
      'bedding',
      'wakeups',
      'parcels',
      'qrcheckin',
      'guestapp',
      'karaoke',
      'artwall',
      'florals',
      'privatechef',
      'mocktails',
      'promos',
      'dawnservice',
      'orbit',
      'rosters',
      'overtime',
      'uniforms',
      'healthcards',
      'visitors',
      'cctvlog',
      'firedrill',
      'insurance',
      'invoices',
      'taxpack',
      'forecast',
      'capex',
      'licenses',
      'slabreaches',
      'apex',
      'extlinks',
      'apikeys',
      'backupsched',
      'sysalerts',
      'bugtracker',
      'releasenotes',
      'runbooks',
      'biometrics',
      'secretsrot',
      'dnscheck',
      'mailqueue',
      'smsqueue',
      'alertrules',
      'edgecache',
      'pyramid',
      'signage',
      'wayfind',
      'beaconmap',
      'iotgates',
      'powerops',
      'waterops',
      'greenops',
      'pestctrl',
      'chemlog',
      'poolops',
      'saunaops',
      'steamops',
      'icebath',
      'recovslots',
      'signalhub',
      'helipad',
      'jetski',
      'yacht',
      'surfschool',
      'paddle',
      'climwall',
      'escaperoom',
      'arcade',
      'bowling',
      'billiards',
      'pokertable',
      'trivia',
      'djbooth',
      'soundcheck',
      'skyline',
      'crowddens',
      'queuetimes',
      'lostchild',
      'firstaid',
      'aedcheck',
      'evacdrill',
      'crowdctrl',
      'radiolog',
      'gatequeue',
      'wristscan',
      'facepass',
      'bagcheck',
      'metaldet',
      'watchlist',
      'sentinel',
    ],
    venueIds: ['venue_olympos_beach', 'venue_kaleici', 'venue_phaseelis'],
    status: 'active',
  },
];

/** Rol → varsayılan marka erişimi */
export const ROLE_BRANDS = {
  ceo: ['brand_likya', 'brand_olympospass', 'brand_daze'],
  kitchen: ['brand_daze'],
  crew: ['brand_olympospass', 'brand_daze'],
};

function ensureSeed() {
  const list = readCollection('brands', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('brands', DEFAULT_BRANDS);
    return DEFAULT_BRANDS;
  }
  // Varsayılan markalara yeni modülleri birleştir (mevcut data/*.json için)
  let dirty = false;
  const merged = list.map((b) => {
    const def = DEFAULT_BRANDS.find((d) => d.id === b.id);
    if (!def) return b;
    const modules = Array.from(new Set([...(b.modules || []), ...def.modules]));
    if (modules.length !== (b.modules || []).length) {
      dirty = true;
      return { ...b, modules };
    }
    return b;
  });
  if (dirty) writeCollection('brands', merged);
  return merged;
}

export function listBrands() {
  return ensureSeed();
}

export function getBrand(id) {
  return listBrands().find((b) => b.id === id) ?? null;
}

export function brandsForRole(role) {
  const allowed = ROLE_BRANDS[role] ?? [];
  return listBrands().filter((b) => allowed.includes(b.id) && b.status === 'active');
}

export function createBrand(input, actor = 'system') {
  const brand = {
    id: input.id || `brand_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'İsimsiz Marka',
    shortName: String(input.shortName || input.name || 'BRD')
      .trim()
      .slice(0, 8)
      .toUpperCase(),
    color: input.color || '#e8a020',
    modules: Array.isArray(input.modules) ? input.modules : [],
    venueIds: Array.isArray(input.venueIds) ? input.venueIds : [],
    status: input.status || 'active',
    createdAt: new Date().toISOString(),
  };
  prependItem('brands', brand, 50);
  appendAudit({
    actor,
    action: 'brands.create',
    detail: brand.name,
    meta: { id: brand.id },
  });
  return brand;
}

export function updateBrand(id, patch, actor = 'system') {
  const brands = listBrands();
  const idx = brands.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  brands[idx] = { ...brands[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('brands', brands);
  appendAudit({
    actor,
    action: 'brands.update',
    detail: brands[idx].name,
    meta: { id },
  });
  return brands[idx];
}

export function removeBrand(id, actor = 'system') {
  const b = getBrand(id);
  if (!b) return null;
  deleteItem('brands', id);
  appendAudit({
    actor,
    action: 'brands.delete',
    detail: b.name,
    meta: { id },
  });
  return b;
}

export function brandsSummary() {
  const brands = listBrands();
  return {
    total: brands.length,
    active: brands.filter((b) => b.status === 'active').length,
    brands,
  };
}
