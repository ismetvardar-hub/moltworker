/**
 * AŞAMA 4 / 9 — Rol tabanlı oturum (hafif token).
 * AŞAMA 9: oturumlar data/sessions.json'a yazılır (restart sonrası kalır).
 */

import crypto from 'node:crypto';
import { readCollection, writeCollection } from './store.js';

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
    'reports',
    'notifications',
    'ops',
    'metrics',
    'field',
    'settings',
  ],
  kitchen: ['hub', 'chef', 'nexus', 'jobs', 'notifications', 'field'],
  crew: ['hub', 'crew', 'olympospass', 'vision', 'notifications', 'field'],
};

function loadSessions() {
  const raw = readCollection('sessions', {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const now = Date.now();
  for (const [token, s] of Object.entries(raw)) {
    if (s && typeof s.exp === 'number' && s.exp > now && s.user) {
      // sayfa listesini güncel ROLE_PAGES ile yenile
      const role = s.user.role;
      sessions.set(token, {
        user: {
          ...s.user,
          pages: ROLE_PAGES[role] ?? s.user.pages ?? [],
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
  return { username: u.username, name: u.name, role: u.role, pages: ROLE_PAGES[u.role] ?? [] };
}

export function login(username, password) {
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return null;
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { user: publicUser(user), exp: Date.now() + TOKEN_TTL_MS });
  persistSessions();
  return { token, user: publicUser(user) };
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
