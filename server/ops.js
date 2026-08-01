/**
 * AŞAMA 11 — Sistem sağlığı ve data yedekleme / geri yükleme.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCollection, writeCollection } from './store.js';
import { listVenues } from './venues.js';
import { jobsSummary } from './jobs.js';
import { getPublicSettings } from './settings.js';
import { sseClientCount } from './events.js';
import { appendAudit } from './audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');

const BACKUP_COLLECTIONS = [
  'archive',
  'whatsapp',
  'nexus-events',
  'audit',
  'jobs',
  'settings',
  'venues',
  'notifications',
  'pass-holders',
  'access-events',
  'brands',
  'guests',
  'playbooks',
  'webhooks',
  'webhook-deliveries',
  'inventory',
  'inventory-movements',
  'shifts',
  'reservations',
  'loyalty-accounts',
  'loyalty-ledger',
  'incidents',
  'incident-acks',
  'suppliers',
  'purchase-orders',
  'feedback',
  'consents',
  'announcements',
  'recipes',
  'checklist-templates',
  'checklist-runs',
  'lost-found',
  'tip-pool',
  'tip-entries',
  'maintenance',
  // sessions bilinçli olarak yedeğe alınabilir ama restore'da opsiyonel
  'sessions',
];

export function healthCheck() {
  const settings = getPublicSettings();
  const jobs = jobsSummary();
  const venues = listVenues();
  let dataOk = true;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
  } catch {
    dataOk = false;
  }

  const checks = {
    dataDirWritable: dataOk,
    venuesSeeded: venues.length > 0,
    settingsConfigured: settings.fields.filter((f) => f.configured).length,
    jobsTotal: jobs.total,
    sseClients: sseClientCount(),
    ollamaUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
  };

  const status =
    !dataOk ? 'unhealthy' : checks.settingsConfigured === 0 ? 'degraded' : 'healthy';

  return {
    status,
    service: 'olympospass-likya-panel',
    version: '1.0.0',
    uptimeSec: Math.round(process.uptime()),
    generatedAt: new Date().toISOString(),
    checks,
  };
}

export function createBackup() {
  const collections = {};
  for (const name of BACKUP_COLLECTIONS) {
    const fallback = name === 'settings' || name === 'sessions' ? {} : [];
    collections[name] = readCollection(name, fallback);
  }
  return {
    format: 'likya-backup-v1',
    createdAt: new Date().toISOString(),
    collections,
  };
}

export function restoreBackup(payload, actor = 'system') {
  if (!payload || payload.format !== 'likya-backup-v1' || !payload.collections) {
    throw new Error('Geçersiz yedek formatı (likya-backup-v1 bekleniyor)');
  }
  const restored = [];
  for (const [name, data] of Object.entries(payload.collections)) {
    if (!BACKUP_COLLECTIONS.includes(name)) continue;
    writeCollection(name, data);
    restored.push(name);
  }
  appendAudit({
    actor,
    action: 'ops.restore',
    detail: `Yedek geri yüklendi: ${restored.join(', ')}`,
    meta: { restored, backupAt: payload.createdAt },
  });
  return { ok: true, restored, backupAt: payload.createdAt };
}

export function listDataFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const st = fs.statSync(path.join(DATA_DIR, f));
      return { name: f, bytes: st.size, mtime: st.mtime.toISOString() };
    });
}
