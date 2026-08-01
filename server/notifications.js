/**
 * AŞAMA 12 — Bildirim merkezi.
 */

import { prependItem, readCollection, writeCollection } from './store.js';
import { randomBytes } from 'node:crypto';

const IMPORTANT = new Set([
  'auth.login',
  'auth.login_failed',
  'jobs.failed',
  'jobs.claim',
  'jobs.create',
  'archive.save',
  'whatsapp.send',
  'nexus.unlock',
  'nexus.lock',
  'nexus.pulse',
  'settings.update',
  'ops.backup',
  'ops.restore',
  'venues.create',
  'venues.update',
  'venues.delete',
  'pass.admit',
  'pass.deny',
  'brands.create',
  'brands.delete',
  'guests.create',
  'guests.sync',
  'playbooks.create',
  'webhooks.create',
  'inventory.adjust',
  'shifts.create',
  'reservations.create',
  'loyalty.adjust',
  'incidents.create',
  'incidents.ack',
  'suppliers.create',
  'po.create',
  'po.receive',
  'feedback.create',
]);

export function pushNotification({ actor, action, detail, meta, level }) {
  // düşük gürültü: yalnızca önemli aksiyonlar veya nexus.*
  if (
    action &&
    !IMPORTANT.has(action) &&
    !String(action).startsWith('nexus.')
  ) {
    return null;
  }
  const entry = {
    id: `ntf_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`,
    at: new Date().toISOString(),
    actor: actor || 'system',
    action: action || 'info',
    detail: detail || '',
    meta: meta ?? undefined,
    level: level || (String(action).includes('fail') ? 'warn' : 'info'),
    read: false,
  };
  prependItem('notifications', entry, 200);
  return entry;
}

/** Audit kaydından bildirim üret (audit.js burayı çağırır). */
export function notifyFromAudit(entry) {
  if (!entry?.action) return null;
  if (!IMPORTANT.has(entry.action) && !String(entry.action).startsWith('nexus.')) {
    return null;
  }
  return pushNotification({
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
    meta: entry.meta,
    level: entry.action.includes('fail') ? 'warn' : 'info',
  });
}

export function listNotifications(limit = 50, unreadOnly = false) {
  let list = readCollection('notifications', []);
  if (unreadOnly) list = list.filter((n) => !n.read);
  return list.slice(0, limit);
}

export function unreadCount() {
  return readCollection('notifications', []).filter((n) => !n.read).length;
}

export function markRead(id) {
  const list = readCollection('notifications', []);
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeCollection('notifications', next);
  return next.find((n) => n.id === id) ?? null;
}

export function markAllRead() {
  const next = readCollection('notifications', []).map((n) => ({ ...n, read: true }));
  writeCollection('notifications', next);
  return { ok: true, count: next.length };
}
