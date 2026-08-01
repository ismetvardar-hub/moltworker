/**
 * AŞAMA 5 — Operasyon audit günlüğü.
 */

import { prependItem, readCollection } from './store.js';
import { randomBytes } from 'node:crypto';
import { broadcast } from './events.js';
import { notifyFromAudit } from './notifications.js';

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
  const ntf = notifyFromAudit(entry);
  broadcast({
    type: 'audit',
    id: entry.id,
    at: entry.at,
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
    meta: entry.meta,
    notificationId: ntf?.id,
  });
  if (ntf) {
    broadcast({
      type: 'notification',
      id: ntf.id,
      at: ntf.at,
      actor: ntf.actor,
      action: ntf.action,
      detail: ntf.detail,
      level: ntf.level,
    });
  }
  return entry;
}

export function readAudit(limit = 50) {
  return readCollection('audit', []).slice(0, limit);
}
