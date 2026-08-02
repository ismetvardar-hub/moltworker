/**
 * AŞAMA 31 — VALKYRIE KVKK / GDPR onay günlüğü.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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
        status: 'active',
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
        status: 'denied',
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
  if (filter.status) list = list.filter((c) => (c.status || (c.granted ? 'active' : 'denied')) === filter.status);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function recordConsent(input, actor = 'system') {
  const purpose = PURPOSES.includes(input.purpose) ? input.purpose : 'marketing';
  const granted = Boolean(input.granted);
  const entry = {
    id: `cns_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    subject: String(input.subject || '').trim() || 'Anonim',
    phone: input.phone || null,
    purpose,
    granted,
    status: input.status || (granted ? 'active' : 'denied'),
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
  const revoked = list.filter((c) => c.status === 'revoked' || c.status === 'expired').length;
  const missingPurposes = PURPOSES.filter((p) => !(byPurpose[p]?.total > 0));
  const flags = readCollection('consent-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA KVKK Onay',
    generatedAt: new Date().toISOString(),
    total: list.length,
    granted: list.filter((c) => c.granted).length,
    denied: list.filter((c) => !c.granted).length,
    revoked,
    purposes: PURPOSES,
    byPurpose,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      granted: list.filter((c) => c.granted).length,
      denied: list.filter((c) => !c.granted).length,
      revoked,
      missing_purposes: missingPurposes.length,
    },
    summaryLines: [
      `Onay ${list.filter((c) => c.granted).length} · ret ${list.filter((c) => !c.granted).length}`,
      `Eksik amaç ${missingPurposes.length} · iptal/expire ${revoked} · flag ${openFlags.length}`,
    ],
  };
}

export function runConsentSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = consentSummary();
  const existing = readCollection('consent-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.missing_purposes || 0) > 0) {
    candidates.push({
      key: 'missing_purposes',
      level: 'warn',
      text: `Eksik amaç kapsaması ${o.summary?.missing_purposes || 0}`,
      domain: 'coverage',
    });
  }
  if (force || (o.summary?.denied || 0) > 0) {
    candidates.push({
      key: 'denied',
      level: 'info',
      text: `Ret kaydı ${o.summary?.denied || 0}`,
      domain: 'denied',
    });
  }
  if (force || (o.summary?.granted || 0) === 0) {
    candidates.push({
      key: 'no_grants',
      level: 'warn',
      text: `Aktif onay ${o.summary?.granted || 0}`,
      domain: 'granted',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Consent heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('cnsf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('consent-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `consent sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cnss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('consent-sweeps', sweep, 80);
  appendAudit({ actor, action: 'consent.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: consentSummary() };
}

export function ackConsentFlag(input = {}, actor = 'system') {
  const list = readCollection('consent-flags', []) || [];
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
  writeCollection('consent-flags', list);
  appendAudit({ actor, action: 'consent.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: consentSummary() };
}

export function recordConsentOps(input = {}, actor = 'system') {
  const entry = recordConsent(
    {
      subject: input.subject || 'Ops Misafir',
      purpose: input.purpose || 'marketing',
      granted: input.granted !== false,
      phone: input.phone,
      channel: input.channel || 'ops',
      note: input.note || 'consent ops record',
    },
    actor,
  );
  appendAudit({ actor, action: 'consent.record_ops', detail: entry.id, meta: { id: entry.id } });
  return { ok: true, consent: entry, overview: consentSummary() };
}

export function revokeConsent(input = {}, actor = 'system') {
  const list = ensureSeed();
  let idx = list.findIndex((c) => c.id === input.id && c.granted && c.status !== 'revoked');
  if (idx < 0) idx = list.findIndex((c) => c.granted && (c.status || 'active') === 'active');
  let row;
  if (idx >= 0) {
    const status = input.status === 'expired' ? 'expired' : 'revoked';
    list[idx] = {
      ...list[idx],
      granted: false,
      status,
      note: String(input.note || status).slice(0, 240),
      updatedAt: new Date().toISOString(),
      revokedBy: actor,
    };
    writeCollection('consents', list);
    row = list[idx];
  } else {
    row = recordConsent(
      {
        subject: input.subject || 'Revoke Seed',
        purpose: input.purpose || 'marketing',
        granted: false,
        status: 'revoked',
        note: 'revoke seed',
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'consent.revoke',
    detail: `${row.subject} · ${row.status}`,
    meta: { id: row.id },
  });
  return { ok: true, consent: row, overview: consentSummary() };
}

export function seedMissingConsents(input = {}, actor = 'system') {
  const o = consentSummary();
  const missing = PURPOSES.filter((p) => !(o.byPurpose?.[p]?.total > 0));
  const created = [];
  const targets = missing.length ? missing : [input.purpose || 'analytics'];
  for (const purpose of targets.slice(0, Number(input.limit) || 5)) {
    created.push(
      recordConsent(
        {
          subject: input.subject || `Coverage ${purpose}`,
          purpose,
          granted: true,
          channel: 'sweep',
          note: 'missing purpose seed',
        },
        actor,
      ),
    );
  }
  appendAudit({ actor, action: 'consent.missing_seed', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, created, overview: consentSummary() };
}
