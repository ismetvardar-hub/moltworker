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
  summary?: SettingsSummary;
}

export interface SettingsSummary {
  title?: string;
  total: number;
  configured: number;
  missing: number;
  missingKeys?: string[];
  stale: boolean;
  updatedAt: string | null;
  flags_open: number;
  invalid_jsonish: number;
  flags?: Array<{ id: string; key: string; text: string; level?: string; status: string }>;
  summaryLines?: string[];
}

export interface SettingsOpsResponse {
  ok: boolean;
  error?: string;
  overview?: SettingsSummary;
  created?: Array<Record<string, unknown>>;
  seeded?: string[];
  flag?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
}

async function parse<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch('/api/settings', { headers: authHeaders() });
  return parse<SettingsResponse>(res, 'Ayarlar alınamadı');
}

export async function saveSettings(patch: Record<string, string>): Promise<SettingsResponse> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  });
  return parse<SettingsResponse>(res, 'Ayarlar kaydedilemedi');
}

async function postSettingsOps(path: string, body: Record<string, unknown> = {}): Promise<SettingsOpsResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return parse<SettingsOpsResponse>(res, 'Settings ops başarısız');
}

export function runSettingsSweep(body: Record<string, unknown> = {}) {
  return postSettingsOps('/api/settings/sweep', body);
}

export function ackSettingsFlag(body: Record<string, unknown> = {}) {
  return postSettingsOps('/api/settings/flag/ack', body);
}

export function refreshSettingsSnapshot(body: Record<string, unknown> = {}) {
  return postSettingsOps('/api/settings/snapshot/refresh', body);
}

export function seedDefaultSettings(body: Record<string, unknown> = {}) {
  return postSettingsOps('/api/settings/defaults/seed', body);
}

export function flagMissingSettingKey(body: Record<string, unknown> = {}) {
  return postSettingsOps('/api/settings/missing/flag', body);
}
