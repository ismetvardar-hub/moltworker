import { authHeaders } from './auth';

export interface SettingField {
  key: string;
  label: string;
  group: 'herodot' | 'whatsapp' | 'nexus' | string;
  secret: boolean;
  configured: boolean;
  value: string;
  source: 'file' | 'env' | 'empty';
}

export interface SettingsResponse {
  fields: SettingField[];
  updatedAt: string | null;
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch('/api/settings', { headers: authHeaders() });
  if (!res.ok) throw new Error('Ayarlar alınamadı');
  return (await res.json()) as SettingsResponse;
}

export async function saveSettings(patch: Record<string, string>): Promise<SettingsResponse> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Ayarlar kaydedilemedi');
  }
  return (await res.json()) as SettingsResponse;
}
