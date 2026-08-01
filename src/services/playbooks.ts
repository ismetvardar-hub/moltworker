import { authHeaders } from './auth';

export interface Playbook {
  id: string;
  title: string;
  category: string;
  prompt: string;
  brandIds: string[];
}

export async function fetchPlaybooks(brandId?: string | null): Promise<Playbook[]> {
  const qs = brandId ? `?brandId=${encodeURIComponent(brandId)}` : '';
  const res = await fetch(`/api/playbooks${qs}`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = (await res.json()) as { playbooks: Playbook[] };
  return data.playbooks ?? [];
}
