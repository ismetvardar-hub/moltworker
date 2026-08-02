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
  'consent.record',
  'announcements.create',
  'recipes.cook',
  'checklist.start',
  'lostfound.create',
  'tips.payout',
  'maintenance.create',
  'maintenance.update',
  'menu.create',
  'campaigns.create',
  'coldchain.alert',
  'handover.create',
  'cash.out',
  'assets.create',
  'energy.log',
  'training.attempt',
  'valet.create',
  'notifications.seed',
  'notifications.sweep',
]);

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function openNotificationsFlags() {
  const flags = readCollection('notifications-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

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

export function notificationsSummary(limit = 80) {
  const list = readCollection('notifications', []);
  const flags = openNotificationsFlags();
  const now = Date.now();
  const unread = list.filter((n) => !n.read);
  const staleUnread = unread.filter((n) => {
    const at = Date.parse(n.at || 0);
    return Number.isFinite(at) && now - at >= 24 * 60 * 60_000;
  });
  const warnUnread = unread.filter((n) => n.level === 'warn' || n.level === 'alert');
  const byAction = unread.reduce((acc, n) => {
    acc[n.action] = (acc[n.action] || 0) + 1;
    return acc;
  }, {});
  const noisyActions = Object.entries(byAction)
    .filter(([, count]) => count >= 5)
    .map(([action, count]) => ({ action, count }));
  return {
    title: 'Bildirim Ops',
    unread: unread.length,
    notifications: list.slice(0, limit),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      unread: unread.length,
      stale_unread: staleUnread.length,
      warn_unread: warnUnread.length,
      noisy_actions: noisyActions.length,
    },
    summaryLines: [
      `Bildirim ${list.length} · okunmamış ${unread.length} · warn ${warnUnread.length}`,
      `Stale ${staleUnread.length} · noisy action ${noisyActions.length} · flag ${flags.length}`,
    ],
  };
}

export function seedNotification(input = {}, actor = 'system') {
  const entry = pushNotification({
    actor,
    action: input.action || 'notifications.seed',
    detail: input.detail || 'Ops seed bildirimi',
    meta: { source: 'notifications.seed', ...(input.meta || {}) },
    level: input.level || 'info',
  });
  if (!entry) return { ok: false, error: 'Bildirim filtreden geçti' };
  return { ok: true, notification: entry, overview: notificationsSummary() };
}

export function runNotificationsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  if (force && input.seed !== false) {
    seedNotification({ detail: input.detail || 'Sweep seed notification', level: input.level || 'warn' }, actor);
  }
  const overview = notificationsSummary();
  const existing = readCollection('notifications-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.summary?.stale_unread || 0) > 0) {
    candidates.push({
      key: 'notifications_stale_unread',
      level: (overview.summary?.stale_unread || 0) > 0 ? 'warn' : 'info',
      text: `Stale okunmamış bildirim ${overview.summary?.stale_unread || 0}`,
      domain: 'sla',
    });
  }
  if (force || (overview.summary?.warn_unread || 0) > 0) {
    candidates.push({
      key: 'notifications_warn_unread',
      level: (overview.summary?.warn_unread || 0) > 0 ? 'alert' : 'info',
      text: `Warn/alert okunmamış bildirim ${overview.summary?.warn_unread || 0}`,
      domain: 'priority',
    });
  }
  if (force || (overview.summary?.noisy_actions || 0) > 0) {
    candidates.push({
      key: 'notifications_noisy_actions',
      level: (overview.summary?.noisy_actions || 0) > 0 ? 'warn' : 'info',
      text: `Noisy action kümeleri ${overview.summary?.noisy_actions || 0}`,
      domain: 'noise',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ntff'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('notifications-flags', list.slice(0, 200));
  const sweep = { id: rid('ntfs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('notifications-sweeps', sweep, 80);
  pushNotification({
    actor,
    action: 'notifications.sweep',
    detail: `notifications sweep · ${created.length} flag`,
    meta: { id: sweep.id, flags: created.map((f) => f.id) },
    level: created.some((f) => f.level === 'alert') ? 'warn' : 'info',
  });
  return { ok: true, sweep, created, overview: notificationsSummary() };
}

export function ackNotificationsFlag(input = {}, actor = 'system') {
  const list = readCollection('notifications-flags', []) || [];
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
  writeCollection('notifications-flags', list);
  return { ok: true, flag: list[idx], overview: notificationsSummary() };
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
