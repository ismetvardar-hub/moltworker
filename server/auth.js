/**
 * AŞAMA 4 — Rol tabanlı oturum (hafif token).
 * Demo kullanıcılar .env ile override edilebilir.
 */

import crypto from 'node:crypto';

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
    'hub',
    'komuta',
    'ollama',
    'ajanlar',
    'olympospass',
    'chef',
    'crew',
    'vision',
    'nexus',
    'settings',
  ],
  kitchen: ['hub', 'chef', 'nexus'],
  crew: ['hub', 'crew', 'olympospass', 'vision'],
};

function publicUser(u) {
  return { username: u.username, name: u.name, role: u.role, pages: ROLE_PAGES[u.role] ?? [] };
}

export function login(username, password) {
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return null;
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { user: publicUser(user), exp: Date.now() + TOKEN_TTL_MS });
  return { token, user: publicUser(user) };
}

export function logout(token) {
  if (token) sessions.delete(token);
}

export function sessionFromToken(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.exp) {
    sessions.delete(token);
    return null;
  }
  return s.user;
}

export function listDemoUsers() {
  return USERS.map((u) => ({
    username: u.username,
    role: u.role,
    name: u.name,
    // Demo paneli için şifre ipucu (üretimde kapatılır)
    hint: process.env.AUTH_HIDE_HINTS === '1' ? undefined : u.password,
  }));
}
