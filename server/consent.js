/**
 * AŞAMA 31 — VALKYRIE KVKK / GDPR onay günlüğü.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

const PURPOSES = ['marketing', 'whatsapp', 'analytics', 'pass-biometrics', 'loyalty'];

function ensureSeed() {
  let list = readCollection('consents', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'cns_1',
        subject: 'Elena K.',
        phone: '+905551112233',
        purpose: 'whatsapp',
        granted: true,
        channel: 'vision',
        version: '2026.1',
        at: new Date(Date.now() - 86400_000).toISOString(),
      },
      {
        id: 'cns_2',
        subject: 'Mert A.',
        phone: null,
        purpose: 'pass-biometrics',
        granted: false,
        channel: 'pass',
        version: '2026.1',
        at: new Date(Date.now() - 3600_000).toISOString(),
      },
    ];
    writeCollection('consents', list);
  }
  return list;
}

export function listConsents(filter = {}) {
  let list = ensureSeed();
  if (filter.purpose) list = list.filter((c) => c.purpose === filter.purpose);
  if (filter.granted !== undefined && filter.granted !== null && filter.granted !== '') {
    const g = filter.granted === true || filter.granted === 'true';
    list = list.filter((c) => c.granted === g);
  }
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function recordConsent(input, actor = 'system') {
  const purpose = PURPOSES.includes(input.purpose) ? input.purpose : 'marketing';
  const entry = {
    id: `cns_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    subject: String(input.subject || '').trim() || 'Anonim',
    phone: input.phone || null,
    purpose,
    granted: Boolean(input.granted),
    channel: input.channel || 'manual',
    version: input.version || '2026.1',
    note: input.note || '',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('consents', entry, 1000);
  appendAudit({
    actor,
    action: 'consent.record',
    detail: `${entry.subject} · ${purpose} · ${entry.granted ? 'ONAY' : 'RET'}`,
    meta: { id: entry.id, purpose, granted: entry.granted },
  });
  return entry;
}

export function consentSummary() {
  const list = listConsents();
  const byPurpose = {};
  for (const p of PURPOSES) {
    const subset = list.filter((c) => c.purpose === p);
    byPurpose[p] = {
      total: subset.length,
      granted: subset.filter((c) => c.granted).length,
      denied: subset.filter((c) => !c.granted).length,
    };
  }
  return {
    total: list.length,
    granted: list.filter((c) => c.granted).length,
    denied: list.filter((c) => !c.granted).length,
    purposes: PURPOSES,
    byPurpose,
  };
}
