export type UserRole = 'ceo' | 'kitchen' | 'crew';

export interface AuthBrand {
  id: string;
  name: string;
  shortName: string;
  color: string;
  modules: string[];
  venueIds: string[];
}

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  pages: string[];
  brandIds?: string[];
  brands?: AuthBrand[];
  activeBrandId?: string | null;
}

export interface DemoUser {
  username: string;
  role: UserRole;
  name: string;
  hint?: string;
}

const TOKEN_KEY = 'likya-auth-token';
const USER_KEY = 'likya-auth-user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persist(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function fetchDemoUsers(): Promise<DemoUser[]> {
  const res = await fetch('/api/auth/demo-users');
  if (!res.ok) return [];
  const data = (await res.json()) as { users: DemoUser[] };
  return data.users;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Giriş başarısız');
  }
  const data = (await res.json()) as { token: string; user: AuthUser };
  persist(data.token, data.user);
  return data.user;
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
  clearAuth();
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    clearAuth();
    return null;
  }
  const data = (await res.json()) as { user: AuthUser };
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
