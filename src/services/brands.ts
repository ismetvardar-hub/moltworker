import { authHeaders, type AuthUser } from './auth';

export interface Brand {
  id: string;
  name: string;
  shortName: string;
  color: string;
  modules: string[];
  venueIds: string[];
  status?: string;
}

export interface BrandFlag {
  id: string;
  key: string;
  level: string;
  text: string;
  domain: string;
  status: string;
  at?: string;
}

export async function fetchBrands(): Promise<{
  brands: Brand[];
  mine: Brand[];
  activeBrandId: string | null;
  total: number;
  active: number;
  inactive?: number;
  emptyModules?: number;
  orphanVenueIds?: number;
  flags?: BrandFlag[];
  summary?: Record<string, number>;
  summaryLines?: string[];
}> {
  const res = await fetch('/api/brands', { headers: authHeaders() });
  if (!res.ok) throw new Error('Markalar alınamadı');
  return (await res.json()) as {
    brands: Brand[];
    mine: Brand[];
    activeBrandId: string | null;
    total: number;
    active: number;
    inactive?: number;
    emptyModules?: number;
    orphanVenueIds?: number;
    flags?: BrandFlag[];
    summary?: Record<string, number>;
    summaryLines?: string[];
  };
}

export async function setActiveBrand(brandId: string): Promise<AuthUser> {
  const res = await fetch('/api/brands/active', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ brandId }),
  });
  if (!res.ok) throw new Error('Marka seçilemedi');
  const data = (await res.json()) as { user: AuthUser };
  localStorage.setItem('likya-auth-user', JSON.stringify(data.user));
  return data.user;
}

export async function createBrand(input: Partial<Brand>): Promise<Brand> {
  const res = await fetch('/api/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Marka oluşturulamadı');
  const data = (await res.json()) as { brand: Brand };
  return data.brand;
}

async function postBrandOps(path: string, body: Record<string, unknown> = {}): Promise<any> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function runBrandsSweep(body: Record<string, unknown> = {}): Promise<any> {
  return postBrandOps('/api/brands/sweep', body);
}

export async function ackBrandsFlag(body: Record<string, unknown> = {}): Promise<any> {
  return postBrandOps('/api/brands/flag/ack', body);
}

export async function activateBrandOps(body: Record<string, unknown> = {}): Promise<any> {
  return postBrandOps('/api/brands/ops/activate', body);
}

export async function syncBrandModules(body: Record<string, unknown> = {}): Promise<any> {
  return postBrandOps('/api/brands/modules/sync', body);
}

export async function seedBrandTenant(body: Record<string, unknown> = {}): Promise<any> {
  return postBrandOps('/api/brands/tenant/seed', body);
}
