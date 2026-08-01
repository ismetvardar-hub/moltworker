/**
 * AŞAMA 5 — Çalışma zamanı ayarları (API anahtarları).
 * data/settings.json → process.env üzerine uygulanır.
 */

import { readCollection, writeCollection } from './store.js';

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

/** Sunucu açılışında bir kez uygula. */
applySettingsToEnv();
