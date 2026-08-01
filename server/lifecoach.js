/**
 * Adım 5 — Yaşam destek uzmanı: fiziksel / mental / temel + wearables.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`; }

function ensureClients() {
  let list = readCollection('life-clients', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'lc_1', athlete_id: 'ath_1', name: 'Deniz Kaya', specialist: 'Uzman Selin', wearables: 'watch' },
      { id: 'lc_2', athlete_id: 'ath_2', name: 'Mira Ak', specialist: 'Uzman Selin', wearables: 'band' },
    ];
    writeCollection('life-clients', list);
  }
  return list;
}

function ensureMetrics() {
  let list = readCollection('life-metrics', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'lm_1', client_id: 'lc_1', sleep_h: 7.2, hrv: 68, mood: 7, load: 62, recovery: 71, source: new Date().toISOString() },
      { id: 'lm_2', client_id: 'lc_2', sleep_h: 6.4, hrv: 52, mood: 5, load: 78, recovery: 48, at: new Date().toISOString() },
    ];
    writeCollection('life-metrics', list);
  }
  return list;
}

export function lifeCoachOverview() {
  const clients = ensureClients();
  const metrics = ensureMetrics();
  const flags = metrics.filter((m) => m.recovery < 55 || m.mood < 6);
  return {
    title: 'Sağlıklı Yaşam Destek',
    clients,
    metrics,
    flags,
    pillars: ['Fiziksel', 'Mental', 'Temel (uyku/beslenme/toparlanma)'],
    summary: { clients: clients.length, flags: flags.length, wearables_linked: clients.filter((c) => c.wearables).length },
    generatedAt: new Date().toISOString(),
  };
}

export function ingestWearable(input = {}, actor = 'system') {
  const row = {
    id: rid('lm'),
    client_id: input.client_id || 'lc_1',
    sleep_h: Number(input.sleep_h) || 7,
    hrv: Number(input.hrv) || 60,
    mood: Number(input.mood) || 6,
    load: Number(input.load) || 50,
    recovery: Number(input.recovery) || 60,
    source: input.source || 'smartwatch',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-metrics', row, 500);
  appendAudit({ actor, action: 'life.wearable', detail: `${row.client_id} recovery ${row.recovery}`, meta: { id: row.id } });
  return { ok: true, metric: row, overview: lifeCoachOverview() };
}

export function createLifePlan(input = {}, actor = 'system') {
  const row = {
    id: rid('lp'),
    client_id: input.client_id || 'lc_1',
    physical: input.physical || 'Hafif tempo + mobilite',
    mental: input.mental || '10 dk nefes / journaling',
    fundamentals: input.fundamentals || 'Uyku 8s hedef · protein öğün',
    status: 'active',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-plans', row, 200);
  appendAudit({ actor, action: 'life.plan', detail: row.client_id, meta: { id: row.id } });
  return { ok: true, plan: row };
}
