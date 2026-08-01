/**
 * AŞAMA 5 — Operasyon audit günlüğü.
 */

import { prependItem, readCollection } from './store.js';
import { randomBytes } from 'node:crypto';

export function appendAudit({ actor, action, detail, meta }) {
  const entry = {
    id: `aud_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`,
    at: new Date().toISOString(),
    actor: actor || 'system',
    action,
    detail: detail || '',
    meta: meta ?? undefined,
  };
  prependItem('audit', entry, 300);
  return entry;
}

export function readAudit(limit = 50) {
  return readCollection('audit', []).slice(0, limit);
}
