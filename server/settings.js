/**
 * AŞAMA 5 — Çalışma zamanı ayarları (API anahtarları).
 * data/settings.json → process.env üzerine uygulanır.
 */

import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

export const SETTING_FIELDS = [
  {
    key: 'BRAVE_SEARCH_API_KEY',
    label: 'Brave Search API Key',
    group: 'herodot',
    secret: true,
  },
  {
    key: 'TAVILY_API_KEY',
    label: 'Tavily API Key',
    group: 'herodot',
    secret: true,
  },
  {
    key: 'TWILIO_ACCOUNT_SID',
    label: 'Twilio Account SID',
    group: 'whatsapp',
    secret: false,
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    label: 'Twilio Auth Token',
    group: 'whatsapp',
    secret: true,
  },
  {
    key: 'TWILIO_WHATSAPP_FROM',
    label: 'Twilio WhatsApp From',
    group: 'whatsapp',
    secret: false,
  },
  {
    key: 'META_WHATSAPP_TOKEN',
    label: 'Meta WhatsApp Token',
    group: 'whatsapp',
    secret: true,
  },
  {
    key: 'META_WHATSAPP_PHONE_ID',
    label: 'Meta Phone Number ID',
    group: 'whatsapp',
    secret: false,
  },
  {
    key: 'WHATSAPP_DEFAULT_TO',
    label: 'Varsayılan WhatsApp alıcı',
    group: 'whatsapp',
    secret: false,
  },
  {
    key: 'NEXUS_LIVE_URL',
    label: 'NEXUS canlı köprü URL',
    group: 'nexus',
    secret: false,
  },
];

const SETTINGS_FLAGS_COLLECTION = 'settings-flags';
const SETTINGS_SWEEPS_COLLECTION = 'settings-sweeps';
const SETTINGS_SNAPSHOTS_COLLECTION = 'settings-snapshots';
const STALE_SETTINGS_DAYS = 30;
const DEFAULT_SETTINGS = Object.fromEntries(SETTING_FIELDS.map((field) => [field.key, '']));
const CRITICAL_SETTING_KEYS = SETTING_FIELDS.map((field) => field.key);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function loadRaw() {
  return readCollection('settings', {});
}

export function applySettingsToEnv(settings = loadRaw()) {
  for (const { key } of SETTING_FIELDS) {
    const val = settings[key];
    if (typeof val === 'string' && val.trim()) {
      process.env[key] = val.trim();
    }
  }
}

function mask(value) {
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

/** UI için maskelenmiş görünüm + dolu/boş durumu. */
export function getPublicSettings() {
  const raw = loadRaw();
  applySettingsToEnv(raw);
  return {
    fields: SETTING_FIELDS.map((f) => {
      const stored = typeof raw[f.key] === 'string' ? raw[f.key] : '';
      const fromEnv = process.env[f.key] || '';
      const effective = stored || fromEnv;
      return {
        ...f,
        configured: Boolean(effective),
        value: f.secret ? (effective ? mask(effective) : '') : stored || '',
        source: stored ? 'file' : fromEnv ? 'env' : 'empty',
      };
    }),
    updatedAt: raw.__updatedAt ?? null,
    summary: settingsSummary(raw),
  };
}

/**
 * Gelen değerleri kaydeder.
 * Secret alanlarda maskeli/boş değer → mevcut saklı değeri korur.
 */
export function saveSettings(patch = {}) {
  const current = loadRaw();
  const next = { ...current };

  for (const field of SETTING_FIELDS) {
    if (!(field.key in patch)) continue;
    const incoming = String(patch[field.key] ?? '').trim();
    if (field.secret) {
      if (!incoming || incoming.startsWith('••••')) continue;
      next[field.key] = incoming;
    } else {
      next[field.key] = incoming;
    }
  }

  next.__updatedAt = new Date().toISOString();
  // store.js koleksiyonları dizi bekliyor olabilir — settings için özel yazım
  writeSettingsObject(next);
  applySettingsToEnv(next);
  return getPublicSettings();
}

function writeSettingsObject(obj) {
  // store.writeCollection JSON yazar; obje de geçerli
  writeCollection('settings', obj);
}

function openSettingsFlags() {
  const flags = readCollection(SETTINGS_FLAGS_COLLECTION, []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function valuePresent(raw, key) {
  const stored = raw[key];
  if (typeof stored === 'string' && stored.trim()) return true;
  return Boolean(process.env[key]);
}

function jsonishInvalidEntries(raw) {
  const invalid = [];
  for (const [key, value] of Object.entries(raw || {})) {
    if (key.startsWith('__')) continue;
    if (typeof value !== 'string') {
      invalid.push({ key, reason: `non_string_${typeof value}` });
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || !['{', '['].includes(trimmed[0])) continue;
    try {
      JSON.parse(trimmed);
    } catch {
      invalid.push({ key, reason: 'invalid_jsonish' });
    }
  }
  return invalid;
}

export function settingsSummary(raw = loadRaw()) {
  const flags = openSettingsFlags();
  const missing = CRITICAL_SETTING_KEYS.filter((key) => !valuePresent(raw, key));
  const configured = SETTING_FIELDS.filter((field) => valuePresent(raw, field.key));
  const updatedAt = raw.__updatedAt ?? null;
  const updatedMs = updatedAt ? Date.parse(updatedAt) : NaN;
  const stale = !Number.isFinite(updatedMs) || Date.now() - updatedMs > STALE_SETTINGS_DAYS * 24 * 60 * 60_000;
  const invalidJsonish = jsonishInvalidEntries(raw);
  return {
    title: 'Platform Settings Ops',
    total: SETTING_FIELDS.length,
    configured: configured.length,
    missing: missing.length,
    missingKeys: missing,
    stale,
    updatedAt,
    flags_open: flags.length,
    invalid_jsonish: invalidJsonish.length,
    flags: flags.slice(0, 30),
    summaryLines: [
      `Settings ${configured.length}/${SETTING_FIELDS.length} configured`,
      `Missing critical ${missing.length} · stale ${stale ? 'yes' : 'no'} · invalid JSON-ish ${invalidJsonish.length}`,
      `Settings flags ${flags.length} open`,
    ],
  };
}

function addSettingsFlags(candidates, actor) {
  const existing = readCollection(SETTINGS_FLAGS_COLLECTION, []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = {
      id: rid('stf'),
      ...c,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection(SETTINGS_FLAGS_COLLECTION, list.slice(0, 200));
  return created;
}

export function runSettingsSweep(input = {}, actor = 'system') {
  const raw = loadRaw();
  const force = !!input.force;
  const staleDays = Number(input.staleDays ?? STALE_SETTINGS_DAYS);
  const missingKeys = CRITICAL_SETTING_KEYS.filter((key) => !valuePresent(raw, key));
  const updatedAt = raw.__updatedAt ?? null;
  const updatedMs = updatedAt ? Date.parse(updatedAt) : NaN;
  const stale =
    !Number.isFinite(updatedMs) ||
    Date.now() - updatedMs > Math.max(1, staleDays) * 24 * 60 * 60_000;
  const invalidJsonish = jsonishInvalidEntries(raw);
  const candidates = [];

  if (force || missingKeys.length > 0) {
    candidates.push({
      key: 'settings_missing_critical',
      level: missingKeys.length > 0 ? 'warn' : 'info',
      text: `Missing critical settings ${missingKeys.length}`,
      domain: 'keys',
      keys: missingKeys,
    });
  }
  if (force || stale) {
    candidates.push({
      key: 'settings_stale_timestamp',
      level: stale ? 'warn' : 'info',
      text: updatedAt ? `Settings timestamp stale: ${updatedAt}` : 'Settings timestamp missing',
      domain: 'freshness',
      updatedAt,
    });
  }
  if (force || invalidJsonish.length > 0) {
    candidates.push({
      key: 'settings_invalid_jsonish',
      level: invalidJsonish.length > 0 ? 'alert' : 'info',
      text: `Invalid JSON-ish setting values ${invalidJsonish.length}`,
      domain: 'shape',
      invalid: invalidJsonish,
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'settings_heartbeat', level: 'info', text: 'Settings heartbeat OK', domain: 'system' });
  }

  const created = addSettingsFlags(candidates, actor);
  const sweep = {
    id: rid('sts'),
    created: created.length,
    missing: missingKeys.length,
    stale,
    invalidJsonish: invalidJsonish.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem(SETTINGS_SWEEPS_COLLECTION, sweep, 80);
  appendAudit({
    actor,
    action: 'settings.sweep',
    detail: `${created.length} flag`,
    meta: { id: sweep.id, missing: missingKeys.length, invalidJsonish: invalidJsonish.length },
  });
  return { ok: true, sweep, created, overview: settingsSummary(raw) };
}

export function ackSettingsFlag(input = {}, actor = 'system') {
  const list = readCollection(SETTINGS_FLAGS_COLLECTION, []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection(SETTINGS_FLAGS_COLLECTION, list);
  appendAudit({ actor, action: 'settings.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: settingsSummary() };
}

export function refreshSettingsSnapshot(input = {}, actor = 'system') {
  const raw = loadRaw();
  const snapshot = {
    id: rid('stsnap'),
    at: new Date().toISOString(),
    actor,
    reason: String(input.reason || 'manual').slice(0, 120),
    configured: SETTING_FIELDS.filter((field) => valuePresent(raw, field.key)).map((field) => field.key),
    missing: CRITICAL_SETTING_KEYS.filter((key) => !valuePresent(raw, key)),
    updatedAt: raw.__updatedAt ?? null,
  };
  prependItem(SETTINGS_SNAPSHOTS_COLLECTION, snapshot, 80);
  appendAudit({ actor, action: 'settings.snapshot', detail: snapshot.reason, meta: { id: snapshot.id } });
  return { ok: true, snapshot, overview: settingsSummary(raw) };
}

export function seedDefaultSettings(input = {}, actor = 'system') {
  const current = loadRaw();
  const next = { ...current };
  const defaults = { ...DEFAULT_SETTINGS, ...(input.defaults || {}) };
  const seeded = [];
  for (const field of SETTING_FIELDS) {
    const value = defaults[field.key];
    if (typeof value !== 'string') continue;
    const hasKey = Object.hasOwn(next, field.key);
    if (typeof next[field.key] === 'string' && next[field.key].trim()) continue;
    if (hasKey && next[field.key] === '' && value === '') continue;
    if (field.secret && value.trim() && !input.allowSecretDefaults) continue;
    next[field.key] = value;
    seeded.push(field.key);
  }
  if (seeded.length) {
    next.__updatedAt = new Date().toISOString();
    next.__seededAt = next.__seededAt || next.__updatedAt;
    writeSettingsObject(next);
    applySettingsToEnv(next);
  }
  appendAudit({
    actor,
    action: 'settings.seedDefaults',
    detail: `${seeded.length} default`,
    meta: { seeded },
  });
  return { ok: true, seeded, overview: settingsSummary(next) };
}

export function flagMissingKey(input = {}, actor = 'system') {
  const key = String(input.key || '').trim();
  if (!key) return { ok: false, error: 'key zorunlu' };
  const field = SETTING_FIELDS.find((f) => f.key === key);
  const raw = loadRaw();
  const missing = !valuePresent(raw, key);
  const created = addSettingsFlags(
    [
      {
        key: `settings_missing_${key}`,
        level: missing ? 'warn' : 'info',
        text: `${field?.label || key} ${missing ? 'missing' : 'present'} check`,
        domain: 'keys',
        settingKey: key,
      },
    ],
    actor,
  );
  appendAudit({
    actor,
    action: 'settings.flagMissingKey',
    detail: key,
    meta: { key, created: created.map((f) => f.id) },
  });
  return { ok: true, missing, created, overview: settingsSummary(raw) };
}

/** Sunucu açılışında bir kez uygula. */
applySettingsToEnv();
