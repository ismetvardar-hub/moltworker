/**
 * AŞAMA 4 / 9 — Rol tabanlı oturum (hafif token).
 * AŞAMA 9: oturumlar data/sessions.json'a yazılır (restart sonrası kalır).
 */

import crypto from 'node:crypto';
import { readCollection, writeCollection } from './store.js';
import { ROLE_BRANDS, brandsForRole } from './brands.js';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 saat
const sessions = new Map(); // token → { user, exp }

const USERS = [
  {
    username: process.env.AUTH_CEO_USER || 'ceo',
    password: process.env.AUTH_CEO_PASS || 'likya2026',
    name: 'LİKYA CEO',
    role: 'ceo',
  },
  {
    username: process.env.AUTH_KITCHEN_USER || 'chef',
    password: process.env.AUTH_KITCHEN_PASS || 'daze123',
    name: 'Daze Chef Operatör',
    role: 'kitchen',
  },
  {
    username: process.env.AUTH_CREW_USER || 'crew',
    password: process.env.AUTH_CREW_PASS || 'crew123',
    name: 'Daze Crew Personel',
    role: 'crew',
  },
];

/** Rol → erişilebilir sayfalar */
export const ROLE_PAGES = {
  ceo: [
    'komuta',
    'hub',
    'ollama',
    'ajanlar',
    'olympospass',
    'chef',
    'crew',
    'vision',
    'nexus',
    'jobs',
    'venues',
    'brands',
    'guests',
    'reports',
    'notifications',
    'ops',
    'metrics',
    'field',
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
    'docs',
    'webhooks',
    'settings',
  ],
  kitchen: [
    'hub',
    'chef',
    'nexus',
    'jobs',
    'notifications',
    'field',
    'guests',
    'inventory',
    'reservations',
    'incidents',
    'suppliers',
    'feedback',
    'announcements',
    'recipes',
    'checklists',
    'lostfound',
    'maintenance',
    'brief',
    'menu',
    'coldchain',
    'handover',
    'assets',
    'energy',
    'training',
    'music',
    'waste',
    'seating',
    'waitlist',
    'complaints',
    'kudos',
    'hours',
    'weather',
    'readiness',
    'valet',
    'spa',
    'delivery',
    'cleaning',
    'laundry',
    'kds',
    'pulse',
    'wifi',
    'eventcal',
    'digest',
    'emergency',
    'docs',
  ],
  crew: [
    'hub',
    'crew',
    'olympospass',
    'vision',
    'notifications',
    'field',
    'guests',
    'shifts',
    'reservations',
    'loyalty',
    'feedback',
    'announcements',
    'checklists',
    'lostfound',
    'tips',
    'maintenance',
    'brief',
    'handover',
    'campaigns',
    'training',
    'waitlist',
    'kudos',
    'weather',
    'readiness',
    'valet',
    'music',
    'seating',
    'complaints',
    'hours',
    'wifi',
    'content',
    'pulse',
    'digest',
    'eventcal',
    'delivery',
    'spa',
  ],
};

function loadSessions() {
  const raw = readCollection('sessions', {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const now = Date.now();
  for (const [token, s] of Object.entries(raw)) {
    if (s && typeof s.exp === 'number' && s.exp > now && s.user) {
      const role = s.user.role;
      const refreshed = publicUser({
        username: s.user.username,
        name: s.user.name,
        role,
      });
      sessions.set(token, {
        user: {
          ...refreshed,
          activeBrandId:
            s.user.activeBrandId &&
            (refreshed.brandIds ?? []).includes(s.user.activeBrandId)
              ? s.user.activeBrandId
              : refreshed.activeBrandId,
        },
        exp: s.exp,
      });
    }
  }
}

function persistSessions() {
  const obj = {};
  const now = Date.now();
  for (const [token, s] of sessions.entries()) {
    if (s.exp > now) obj[token] = s;
  }
  writeCollection('sessions', obj);
}

loadSessions();

function publicUser(u) {
  const brands = brandsForRole(u.role).map((b) => ({
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    color: b.color,
    modules: b.modules,
    venueIds: b.venueIds,
  }));
  return {
    username: u.username,
    name: u.name,
    role: u.role,
    pages: ROLE_PAGES[u.role] ?? [],
    brandIds: ROLE_BRANDS[u.role] ?? [],
    brands,
    activeBrandId: brands[0]?.id ?? null,
  };
}

export function login(username, password) {
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return null;
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { user: publicUser(user), exp: Date.now() + TOKEN_TTL_MS });
  persistSessions();
  return { token, user: publicUser(user) };
}

/** Aktif marka oturumda güncelle */
export function setActiveBrand(token, brandId) {
  const s = sessions.get(token);
  if (!s) return null;
  const allowed = s.user.brandIds ?? [];
  if (!allowed.includes(brandId)) return null;
  s.user = { ...s.user, activeBrandId: brandId };
  sessions.set(token, s);
  persistSessions();
  return s.user;
}

export function logout(token) {
  if (token) {
    sessions.delete(token);
    persistSessions();
  }
}

export function sessionFromToken(token) {
  if (!token) return null;
  let s = sessions.get(token);
  if (!s) {
    // dosyadan yeniden dene (çoklu process / sıcak yükleme)
    loadSessions();
    s = sessions.get(token);
  }
  if (!s) return null;
  if (Date.now() > s.exp) {
    sessions.delete(token);
    persistSessions();
    return null;
  }
  return s.user;
}

export function listDemoUsers() {
  return USERS.map((u) => ({
    username: u.username,
    role: u.role,
    name: u.name,
    hint: process.env.AUTH_HIDE_HINTS === '1' ? undefined : u.password,
  }));
}
