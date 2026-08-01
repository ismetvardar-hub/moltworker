/**
 * AŞAMA 29 — Misafir geri bildirim / NPS.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensureSeed() {
  let list = readCollection('feedback', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'fb_1',
        score: 9,
        channel: 'vision',
        guestName: 'Elena K.',
        venueId: 'venue_olympos_beach',
        brandId: 'brand_daze',
        comment: 'Sahil servisi çok nazikti.',
        tags: ['servis'],
        at: new Date(Date.now() - 3600_000).toISOString(),
      },
      {
        id: 'fb_2',
        score: 7,
        channel: 'pass',
        guestName: 'Mert A.',
        venueId: 'venue_kaleici',
        brandId: 'brand_olympospass',
        comment: 'Turnike biraz yavaştı.',
        tags: ['geçiş'],
        at: new Date(Date.now() - 7200_000).toISOString(),
      },
      {
        id: 'fb_3',
        score: 10,
        channel: 'manual',
        guestName: 'Ayşe T.',
        venueId: 'venue_olympos_beach',
        brandId: 'brand_daze',
        comment: 'Daze-Gift sürprizi harikaydı.',
        tags: ['gift'],
        at: new Date(Date.now() - 86400_000).toISOString(),
      },
    ];
    writeCollection('feedback', list);
  }
  return list;
}

export function listFeedback(filter = {}) {
  let list = ensureSeed();
  if (filter.venueId) list = list.filter((f) => f.venueId === filter.venueId);
  if (filter.brandId) list = list.filter((f) => f.brandId === filter.brandId);
  if (filter.channel) list = list.filter((f) => f.channel === filter.channel);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createFeedback(input, actor = 'system') {
  const score = Math.min(10, Math.max(0, Number(input.score) || 0));
  const entry = {
    id: `fb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    score,
    channel: input.channel || 'manual',
    guestName: input.guestName || 'Anonim',
    venueId: input.venueId || null,
    brandId: input.brandId || 'brand_daze',
    comment: input.comment || '',
    tags: Array.isArray(input.tags) ? input.tags : [],
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('feedback', entry, 500);
  appendAudit({
    actor,
    action: 'feedback.create',
    detail: `NPS ${score} — ${entry.guestName}`,
    meta: { id: entry.id, score },
  });
  return entry;
}

export function feedbackSummary() {
  const list = listFeedback();
  if (list.length === 0) {
    return { count: 0, nps: null, avg: null, promoters: 0, passives: 0, detractors: 0 };
  }
  const promoters = list.filter((f) => f.score >= 9).length;
  const passives = list.filter((f) => f.score >= 7 && f.score <= 8).length;
  const detractors = list.filter((f) => f.score <= 6).length;
  const nps = Math.round(((promoters - detractors) / list.length) * 100);
  const avg = Math.round((list.reduce((s, f) => s + f.score, 0) / list.length) * 10) / 10;
  return { count: list.length, nps, avg, promoters, passives, detractors };
}
