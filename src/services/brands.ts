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

export async function fetchBrands(): Promise<{
  brands: Brand[];
  mine: Brand[];
  activeBrandId: string | null;
  total: number;
  active: number;
}> {
  const res = await fetch('/api/brands', { headers: authHeaders() });
  if (!res.ok) throw new Error('Markalar alınamadı');
  return (await res.json()) as {
    brands: Brand[];
    mine: Brand[];
    activeBrandId: string | null;
    total: number;
    active: number;
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
