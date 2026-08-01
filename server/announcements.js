/**
 * AŞAMA 32 — Holding / marka duyuru panosu.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    total: list.length,
    published: list.filter((a) => a.status === 'published').length,
  };
}
