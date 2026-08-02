/**
 * AŞAMA 29 — Misafir geri bildirim / NPS.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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
  const flags = readCollection('feedback-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  if (list.length === 0) {
    return {
      title: 'LİKYA Geri Bildirim / NPS',
      generatedAt: new Date().toISOString(),
      count: 0,
      nps: null,
      avg: null,
      promoters: 0,
      passives: 0,
      detractors: 0,
      flags: openFlags.slice(0, 30),
      summary: { flags_open: openFlags.length, count: 0, nps: null, low: 0 },
      summaryLines: [`Feedback yok · flag ${openFlags.length} açık`],
    };
  }
  const promoters = list.filter((f) => f.score >= 9).length;
  const passives = list.filter((f) => f.score >= 7 && f.score <= 8).length;
  const detractors = list.filter((f) => f.score <= 6).length;
  const low = list.filter((f) => f.score <= 6).length;
  const nps = Math.round(((promoters - detractors) / list.length) * 100);
  const avg = Math.round((list.reduce((s, f) => s + f.score, 0) / list.length) * 10) / 10;
  return {
    title: 'LİKYA Geri Bildirim / NPS',
    generatedAt: new Date().toISOString(),
    count: list.length,
    nps,
    avg,
    promoters,
    passives,
    detractors,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      count: list.length,
      nps,
      avg,
      low,
      detractors,
    },
    summaryLines: [
      `NPS ${nps} · ort ${avg} · ${list.length} kayıt`,
      `Detractor ${detractors} · düşük skor ${low} · flag ${openFlags.length} açık`,
    ],
  };
}

export function runFeedbackSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = feedbackSummary();
  const existing = readCollection('feedback-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.low || 0) > 0 || (o.summary?.detractors || 0) > 0) {
    candidates.push({
      key: 'low_scores',
      level: (o.summary?.low || 0) > 0 ? 'warn' : 'info',
      text: `Düşük skor ${o.summary?.low || 0} · detractor ${o.summary?.detractors || 0}`,
      domain: 'nps',
    });
  }
  if (force || (o.summary?.nps != null && o.summary.nps < 50)) {
    candidates.push({
      key: 'nps_soft',
      level: (o.summary?.nps ?? 100) < 30 ? 'alert' : 'warn',
      text: `NPS ${o.summary?.nps ?? '—'}`,
      domain: 'nps',
    });
  }
  if (force || (o.summary?.count || 0) < 3) {
    candidates.push({
      key: 'volume',
      level: 'info',
      text: `Feedback hacmi ${o.summary?.count || 0}`,
      domain: 'volume',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Feedback heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('fbf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('feedback-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `feedback sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('fbs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('feedback-sweeps', sweep, 80);
  appendAudit({ actor, action: 'feedback.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: feedbackSummary() };
}

export function ackFeedbackFlag(input = {}, actor = 'system') {
  const list = readCollection('feedback-flags', []) || [];
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
  writeCollection('feedback-flags', list);
  appendAudit({ actor, action: 'feedback.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: feedbackSummary() };
}

export function seedNpsFeedback(input = {}, actor = 'system') {
  const samples = Array.isArray(input.samples) && input.samples.length
    ? input.samples
    : [
        { score: 9, guestName: 'NPS Seed A', comment: 'seed promoter' },
        { score: 8, guestName: 'NPS Seed B', comment: 'seed passive' },
        { score: 5, guestName: 'NPS Seed C', comment: 'seed detractor' },
      ];
  const created = [];
  for (const s of samples.slice(0, Number(input.limit) || 5)) {
    created.push(
      createFeedback(
        {
          score: s.score ?? 9,
          guestName: s.guestName || 'NPS Seed',
          comment: s.comment || 'nps seed',
          channel: s.channel || 'manual',
          tags: s.tags || ['seed'],
        },
        actor,
      ),
    );
  }
  appendAudit({ actor, action: 'feedback.nps_seed', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, created, overview: feedbackSummary() };
}

export function flagLowScores(input = {}, actor = 'system') {
  const threshold = Number(input.threshold) || 6;
  const lows = listFeedback().filter((f) => f.score <= threshold);
  const existing = readCollection('feedback-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  for (const row of lows.slice(0, Number(input.limit) || 20)) {
    const key = `low_${row.id}`;
    if (openKeys.has(key)) continue;
    const flag = {
      id: rid('fbf'),
      key,
      level: row.score <= 3 ? 'alert' : 'warn',
      text: `Düşük skor ${row.score} · ${row.guestName}`,
      domain: 'low',
      feedback_id: row.id,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(flag);
    created.push(flag);
    openKeys.add(key);
  }
  if (!created.length) {
    const seeded = createFeedback(
      { score: 4, guestName: 'Low seed', comment: 'flag-low seed', tags: ['low'] },
      actor,
    );
    const flag = {
      id: rid('fbf'),
      key: `low_${seeded.id}`,
      level: 'warn',
      text: `Düşük skor ${seeded.score} · ${seeded.guestName}`,
      domain: 'low',
      feedback_id: seeded.id,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(flag);
    created.push(flag);
  }
  writeCollection('feedback-flags', list.slice(0, 200));
  appendAudit({ actor, action: 'feedback.low_flag', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, created, overview: feedbackSummary() };
}

export function archiveFeedbackFlags(input = {}, actor = 'system') {
  const list = readCollection('feedback-flags', []) || [];
  if (!Array.isArray(list) || !list.length) {
    runFeedbackSweep({ force: true }, actor);
  }
  const flags = readCollection('feedback-flags', []) || [];
  const arr = Array.isArray(flags) ? flags : [];
  const archived = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i].status !== 'open') continue;
    if (input.id && arr[i].id !== input.id) continue;
    if (input.key && arr[i].key !== input.key) continue;
    arr[i] = {
      ...arr[i],
      status: 'archived',
      note: String(input.note || 'archive').slice(0, 240),
      acked_at: new Date().toISOString(),
      acked_by: actor,
    };
    archived.push(arr[i].id);
    if (archived.length >= (Number(input.limit) || 20)) break;
  }
  if (!archived.length) {
    const open = arr.find((f) => f.status === 'open');
    if (open) {
      const idx = arr.findIndex((f) => f.id === open.id);
      arr[idx] = { ...arr[idx], status: 'archived', acked_at: new Date().toISOString(), acked_by: actor };
      archived.push(arr[idx].id);
    }
  }
  writeCollection('feedback-flags', arr);
  appendAudit({ actor, action: 'feedback.flags_archive', detail: `${archived.length}`, meta: { n: archived.length } });
  return { ok: true, archived, overview: feedbackSummary() };
}
