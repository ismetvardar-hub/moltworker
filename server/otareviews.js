/**
 * Wave 175 - OTA review response ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('otareviews', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ota_1',
      channel: "Booking",
      score: 9,
      status: 'new',
      at: new Date().toISOString(),
    }];
    writeCollection('otareviews', seed);
    return seed;
  }
  return list;
}

function openOtareviewsFlags() {
  const flags = readCollection('otareviews-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addOtareviewsFlag(candidate, actor = 'system') {
  const existing = readCollection('otareviews-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('otf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('otareviews-flags', list.slice(0, 200));
  return flag;
}

function isLowScore(row) {
  return row.lowScore === true || row.status === 'low_score' || Number(row.score ?? 0) <= 6;
}

function hasReplyDraft(row) {
  return row.replyDrafted === true || row.replyDraft || row.status === 'drafted';
}

function hasRecoveryOffer(row) {
  return row.recoveryOffer === true || row.offerType === 'recovery_offer';
}

export function listOtareviews(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createOtareviews(input = {}, actor = 'system') {
  const row = {
    id: rid('ota'),
    channel: input.channel !== undefined ? input.channel : "Booking",
    score: input.score !== undefined ? Number(input.score) || 0 : 9,
    guestName: input.guestName !== undefined ? input.guestName : undefined,
    comment: input.comment !== undefined ? input.comment : undefined,
    replyDraft: input.replyDraft !== undefined ? input.replyDraft : undefined,
    recoveryOffer: input.recoveryOffer === true || undefined,
    offerType: input.offerType !== undefined ? input.offerType : undefined,
    status: input.status || 'new',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('otareviews', row, 300);
  appendAudit({
    actor,
    action: 'otareviews.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateOtareviews(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.score !== undefined) next.score = Number(next.score) || 0;
  list[idx] = next;
  writeCollection('otareviews', list);
  appendAudit({ actor, action: 'otareviews.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function otareviewsSummary() {
  const list = listOtareviews();
  const lowScores = list.filter(isLowScore);
  const replyDrafts = list.filter(hasReplyDraft);
  const recoveryOffers = list.filter(hasRecoveryOffer);
  const flags = openOtareviewsFlags();
  return {
    title: 'LIKYA OTA Review Ops',
    total: list.length,
    new: list.filter((x) => x.status === 'new').length,
    replied: list.filter((x) => x.status === 'replied').length,
    escalated: list.filter((x) => x.status === 'escalated').length,
    lowScores: lowScores.length,
    replyDrafts: replyDrafts.length,
    recoveryOffers: recoveryOffers.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      new: list.filter((x) => x.status === 'new').length,
      replied: list.filter((x) => x.status === 'replied').length,
      escalated: list.filter((x) => x.status === 'escalated').length,
      low_scores: lowScores.length,
      reply_drafts: replyDrafts.length,
      recovery_offers: recoveryOffers.length,
    },
    summaryLines: [
      `OTA ${list.length} review - low score ${lowScores.length} - draft ${replyDrafts.length}`,
      `New ${list.filter((x) => x.status === 'new').length} - recovery offer ${recoveryOffers.length} - flag ${flags.length}`,
    ],
    otareviews: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runOtareviewsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = otareviewsSummary();
  const lowScoreThreshold = Number(input.lowScoreThreshold ?? input.threshold ?? 6) || 6;
  const created = [];
  const candidates = [];
  if (force || overview.lowScores > 0) {
    candidates.push({
      key: 'otareviews_low_score_spike',
      level: overview.lowScores > 0 ? 'warn' : 'info',
      text: `OTA low score reviews ${overview.lowScores} at threshold ${lowScoreThreshold}`,
      domain: 'score',
    });
  }
  if (force || overview.replyDrafts === 0) {
    candidates.push({
      key: 'otareviews_reply_draft_needed',
      level: overview.replyDrafts === 0 ? 'warn' : 'info',
      text: `OTA reply drafts ${overview.replyDrafts}`,
      domain: 'reply',
    });
  }
  if (force || overview.recoveryOffers === 0) {
    candidates.push({
      key: 'otareviews_recovery_offer_seed',
      level: 'info',
      text: `OTA recovery offers ${overview.recoveryOffers}`,
      domain: 'recovery',
    });
  }
  for (const candidate of candidates) {
    const flag = addOtareviewsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `otareviews sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('ots'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('otareviews-sweeps', sweep, 80);
  appendAudit({ actor, action: 'otareviews.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: otareviewsSummary() };
}

export function ackOtareviewsFlag(input = {}, actor = 'system') {
  const list = readCollection('otareviews-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('otareviews-flags', list);
  appendAudit({ actor, action: 'otareviews.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: otareviewsSummary() };
}

export function markOtareviewsLowScoreSpike(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.channel && x.channel === input.channel));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isLowScore(x));
  if (idx < 0) return { ok: false, error: 'Low score yapilacak OTA review yok' };
  list[idx] = {
    ...list[idx],
    status: 'low_score',
    score: Number(input.score ?? 4) || 4,
    lowScore: true,
    lowScoreReason: input.reason || input.lowScoreReason || 'service_recovery',
    lowScoreAt: input.lowScoreAt || new Date().toISOString(),
    lowScoreBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('otareviews', list);
  appendAudit({ actor, action: 'otareviews.low_score', detail: list[idx].channel || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, review: list[idx], overview: otareviewsSummary() };
}

export function draftOtareviewsReply(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.channel && x.channel === input.channel));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'new' || isLowScore(x));
  if (idx < 0) {
    const review = createOtareviews({
      channel: input.channel || 'Booking',
      score: input.score ?? 5,
      status: 'drafted',
      replyDraft: input.replyDraft || 'Thank you for the feedback; our team is following up with a recovery offer.',
    }, actor);
    return { ok: true, review, overview: otareviewsSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'drafted',
    replyDrafted: true,
    replyDraft: input.replyDraft || 'Thank you for the feedback; our team is following up with a recovery offer.',
    draftedAt: input.draftedAt || new Date().toISOString(),
    draftedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('otareviews', list);
  appendAudit({ actor, action: 'otareviews.reply_draft', detail: list[idx].channel || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, review: list[idx], overview: otareviewsSummary() };
}

export function seedOtareviewsRecoveryOffer(input = {}, actor = 'system') {
  const review = createOtareviews(
    {
      channel: input.channel || 'Tripadvisor',
      score: input.score ?? 5,
      status: input.status || 'escalated',
      guestName: input.guestName || 'Wave 175 Recovery Guest',
      comment: input.comment || 'Service recovery follow-up required',
      recoveryOffer: true,
      offerType: input.offerType || 'spa_credit',
    },
    actor,
  );
  appendAudit({ actor, action: 'otareviews.seed_recovery_offer', detail: review.channel, meta: { id: review.id } });
  return { ok: true, review, overview: otareviewsSummary() };
}
