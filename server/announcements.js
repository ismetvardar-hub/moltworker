/**
 * AŞAMA 32 — Holding / marka duyuru panosu.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function addDays(days) {
  return new Date(Date.now() + Number(days) * 86400_000).toISOString();
}

function daysUntil(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / 86400_000);
}

function daysOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 86400_000;
}

function ensureSeed() {
  let list = readCollection('announcements', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'ann_1',
        title: 'Sezon açılış brifingi',
        body: 'Tüm şefler ve kapı ekipleri 09:00 Komuta toplantısında.',
        audience: 'all',
        brandId: 'brand_likya',
        priority: 'high',
        status: 'published',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      },
    ];
    writeCollection('announcements', list);
  }
  return list;
}

export function listAnnouncements(filter = {}) {
  let list = ensureSeed();
  if (filter.status) list = list.filter((a) => a.status === filter.status);
  if (filter.brandId) list = list.filter((a) => a.brandId === filter.brandId || a.audience === 'all');
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function createAnnouncement(input, actor = 'system') {
  const ann = {
    id: `ann_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || '').trim() || 'Duyuru',
    body: String(input.body || '').trim(),
    audience: input.audience || 'all',
    brandId: input.brandId || 'brand_likya',
    priority: input.priority || 'normal',
    status: input.status || 'published',
    publishAt: input.publishAt || (input.status === 'published' || !input.status ? new Date().toISOString() : undefined),
    endAt: input.endAt || undefined,
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('announcements', ann, 200);
  appendAudit({
    actor,
    action: 'announcements.create',
    detail: ann.title,
    meta: { id: ann.id, audience: ann.audience },
  });
  return ann;
}

export function updateAnnouncement(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('announcements', list);
  appendAudit({
    actor,
    action: 'announcements.update',
    detail: list[idx].title,
    meta: { id },
  });
  return list[idx];
}

export function removeAnnouncement(id, actor = 'system') {
  const a = ensureSeed().find((x) => x.id === id);
  if (!a) return null;
  deleteItem('announcements', id);
  appendAudit({ actor, action: 'announcements.delete', detail: a.title, meta: { id } });
  return a;
}

export function announcementsSummary() {
  const list = listAnnouncements();
  const flags = readCollection('announcements-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const unpublishedHighPriority = list.filter(
    (a) => (a.priority === 'high' || a.priority === 'critical') && a.status !== 'published',
  );
  const stalePublished = list.filter(
    (a) => a.status === 'published' && daysOld(a.publishAt || a.createdAt) >= 14,
  );
  const endingSoon = list.filter((a) => {
    if (a.status !== 'published') return false;
    const left = daysUntil(a.endAt);
    return left != null && left >= 0 && left <= 2;
  });
  return {
    title: 'LİKYA Duyuru Ops',
    total: list.length,
    published: list.filter((a) => a.status === 'published').length,
    unpublishedHighPriority: unpublishedHighPriority.length,
    stalePublished: stalePublished.length,
    endingSoon: endingSoon.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      published: list.filter((a) => a.status === 'published').length,
      unpublished_high_priority: unpublishedHighPriority.length,
      stale_published: stalePublished.length,
      ending_soon: endingSoon.length,
    },
    summaryLines: [
      `Duyuru ${list.length} · published ${list.filter((a) => a.status === 'published').length}`,
      `Yayınlanmamış high ${unpublishedHighPriority.length} · stale ${stalePublished.length} · ending soon ${endingSoon.length}`,
    ],
  };
}

export function runAnnouncementsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = announcementsSummary();
  const existing = readCollection('announcements-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.unpublishedHighPriority || 0) > 0) {
    candidates.push({
      key: 'announcements_unpublished_high_priority',
      level: (overview.unpublishedHighPriority || 0) > 0 ? 'alert' : 'info',
      text: `Yayınlanmamış high-priority duyuru ${overview.unpublishedHighPriority || 0}`,
      domain: 'priority',
    });
  }
  if (force || (overview.stalePublished || 0) > 0) {
    candidates.push({
      key: 'announcements_stale_published',
      level: (overview.stalePublished || 0) > 0 ? 'warn' : 'info',
      text: `Stale published duyuru ${overview.stalePublished || 0}`,
      domain: 'freshness',
    });
  }
  if (force || (overview.endingSoon || 0) > 0) {
    candidates.push({
      key: 'announcements_ending_soon',
      level: 'info',
      text: `Bitmek üzere duyuru ${overview.endingSoon || 0}`,
      domain: 'window',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('annf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('announcements-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-HUB',
        title: `announcements sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('anns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('announcements-sweeps', sweep, 80);
  appendAudit({ actor, action: 'announcements.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: announcementsSummary() };
}

export function ackAnnouncementsFlag(input = {}, actor = 'system') {
  const list = readCollection('announcements-flags', []) || [];
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
  writeCollection('announcements-flags', list);
  appendAudit({ actor, action: 'announcements.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: announcementsSummary() };
}

/** Mutator 1 — publish high-priority drafts/scheduled announcements. */
export function publishHighPriorityAnnouncements(input = {}, actor = 'system') {
  let rows = listAnnouncements().filter(
    (a) => (a.priority === 'high' || a.priority === 'critical') && a.status !== 'published',
  );
  if (input.id) rows = rows.filter((a) => a.id === input.id);
  if (!rows.length && input.seed !== false) {
    rows = [
      createAnnouncement(
        {
          title: input.title || 'High priority draft seed',
          body: input.body || 'Ops publish seed',
          priority: input.priority || 'high',
          status: 'draft',
        },
        actor,
      ),
    ];
  }
  const published = [];
  let announcement = null;
  for (const row of rows.slice(0, Number(input.limit) || 10)) {
    const next = updateAnnouncement(
      row.id,
      {
        status: 'published',
        publishAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        publishedBy: actor,
      },
      actor,
    );
    if (next) {
      announcement = next;
      published.push(next.id);
    }
  }
  appendAudit({ actor, action: 'announcements.publish_high_priority', detail: `${published.length}`, meta: { n: published.length } });
  return { ok: true, announcement, published, overview: announcementsSummary() };
}

/** Mutator 2 — archive stale published announcements. */
export function archiveStaleAnnouncements(input = {}, actor = 'system') {
  const days = Number(input.days) || 14;
  let rows = listAnnouncements().filter((a) => a.status === 'published' && daysOld(a.publishAt || a.createdAt) >= days);
  if (input.id) rows = rows.filter((a) => a.id === input.id);
  if (!rows.length && input.seed !== false) {
    const seeded = createAnnouncement(
      {
        title: input.title || 'Stale announcement seed',
        body: input.body || 'Archive seed',
        priority: 'normal',
        status: 'published',
      },
      actor,
    );
    const old = new Date(Date.now() - (days + 2) * 86400_000).toISOString();
    rows = [updateAnnouncement(seeded.id, { createdAt: old, publishAt: old }, actor)].filter(Boolean);
  }
  const archived = [];
  let announcement = null;
  for (const row of rows.slice(0, Number(input.limit) || 10)) {
    const next = updateAnnouncement(
      row.id,
      {
        status: 'archived',
        archivedAt: new Date().toISOString(),
        archivedBy: actor,
      },
      actor,
    );
    if (next) {
      announcement = next;
      archived.push(next.id);
    }
  }
  appendAudit({ actor, action: 'announcements.archive_stale', detail: `${archived.length}`, meta: { n: archived.length } });
  return { ok: true, announcement, archived, overview: announcementsSummary() };
}

/** Mutator 3 — create a published announcement whose display window ends soon. */
export function seedEndingSoonAnnouncement(input = {}, actor = 'system') {
  const announcement = createAnnouncement(
    {
      title: input.title || 'Ending soon announcement seed',
      body: input.body || 'Duyuru penceresi yakında kapanıyor.',
      audience: input.audience || 'all',
      brandId: input.brandId || 'brand_likya',
      priority: input.priority || 'high',
      status: 'published',
      endAt: input.endAt || addDays(Number(input.days) || 1),
    },
    actor,
  );
  appendAudit({ actor, action: 'announcements.seed_ending_soon', detail: announcement.title, meta: { id: announcement.id } });
  return { ok: true, announcement, seeded: [announcement.id], overview: announcementsSummary() };
}
