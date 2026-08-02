/**
 * AŞAMA 68 — İçerik Kuyruğu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('content-queue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "cnt_1",
    "title": "Sahil golden hour",
    "channel": "instagram",
    "status": "review"
  }
];
    writeCollection('content-queue', seed);
    return seed;
  }
  return list;
}

function openContentFlags() {
  const flags = readCollection('content-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addContentFlag(candidate, actor = 'system') {
  const existing = readCollection('content-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('conf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('content-flags', list.slice(0, 200));
  return flag;
}

function isStaleDraft(row) {
  if (row.staleDraft === true || row.status === 'stale_draft') return true;
  if (row.status !== 'draft') return false;
  const at = Date.parse(row.draftAt || row.updatedAt || row.at || '');
  return Number.isFinite(at) && at < Date.now() - 48 * 60 * 60_000;
}

export function listContent(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createContent(input, actor = 'system') {
  const row = {
    id: `con_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"title":"Yeni içerik","channel":"instagram"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"title":"Yeni içerik","channel":"instagram"}[k]];
    })),
    status: input.status || 'review',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  if (row.qty !== undefined) row.qty = Number(row.qty) || 0;
  if (row.minutes !== undefined) row.minutes = Number(row.minutes) || 0;
  if (row.score !== undefined) row.score = Number(row.score) || 0;
  if (row.planned !== undefined) row.planned = Number(row.planned) || 0;
  if (row.actual !== undefined) row.actual = Number(row.actual) || 0;
  if (row.balance !== undefined) row.balance = Number(row.balance) || 0;
  if (row.etaMin !== undefined) row.etaMin = Number(row.etaMin) || 0;
  if (row.minQty !== undefined) row.minQty = Number(row.minQty) || 0;
  if (row.partySize !== undefined) row.partySize = Number(row.partySize) || 0;
  if (row.costTry !== undefined) row.costTry = Number(row.costTry) || 0;
  if (row.seats !== undefined) row.seats = Number(row.seats) || 0;
  
  prependItem('content-queue', row, 300);
  appendAudit({ actor, action: 'content.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateContent(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('content-queue', list);
  appendAudit({ actor, action: 'content.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function contentSummary() {
  const list = listContent();
  const staleDrafts = list.filter(isStaleDraft);
  const campaignPosts = list.filter((x) => x.campaignPost === true || x.kind === 'campaign');
  const flags = openContentFlags();
  return {
    title: 'LIKYA Content Ops',
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    staleDrafts: staleDrafts.length,
    review: list.filter((x) => x.status === 'review').length,
    approved: list.filter((x) => x.status === 'approved').length,
    published: list.filter((x) => x.status === 'published').length,
    campaignPosts: campaignPosts.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      draft: list.filter((x) => x.status === 'draft').length,
      stale_drafts: staleDrafts.length,
      review: list.filter((x) => x.status === 'review').length,
      approved: list.filter((x) => x.status === 'approved').length,
      published: list.filter((x) => x.status === 'published').length,
      campaign_posts: campaignPosts.length,
    },
    summaryLines: [
      `Content ${list.length} item - stale draft ${staleDrafts.length} - review ${list.filter((x) => x.status === 'review').length}`,
      `Campaign posts ${campaignPosts.length} - published ${list.filter((x) => x.status === 'published').length} - flag ${flags.length}`,
    ],
    items: list,
  };
}

export function runContentSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = contentSummary();
  const created = [];
  const candidates = [];
  if (force || overview.staleDrafts > 0) {
    candidates.push({
      key: 'content_stale_draft',
      level: overview.staleDrafts > 0 ? 'warn' : 'info',
      text: `Content stale drafts ${overview.staleDrafts}`,
      domain: 'draft',
    });
  }
  if (force || overview.review > 0) {
    candidates.push({
      key: 'content_review_queue',
      level: 'info',
      text: `Content review queue ${overview.review}`,
      domain: 'review',
    });
  }
  if (force || overview.campaignPosts > 0) {
    candidates.push({
      key: 'content_campaign_post',
      level: 'info',
      text: `Campaign posts ${overview.campaignPosts}`,
      domain: 'campaign',
    });
  }
  for (const candidate of candidates) {
    const flag = addContentFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `content sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('cons'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('content-sweeps', sweep, 80);
  appendAudit({ actor, action: 'content.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: contentSummary() };
}

export function ackContentFlag(input = {}, actor = 'system') {
  const list = readCollection('content-flags', []) || [];
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
  writeCollection('content-flags', list);
  appendAudit({ actor, action: 'content.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: contentSummary() };
}

export function markContentStaleDraft(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.title && x.title === input.title));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'published');
  if (idx < 0) return { ok: false, error: 'Stale draft yapilacak content yok' };
  list[idx] = {
    ...list[idx],
    status: 'draft',
    staleDraft: true,
    draftAt: input.draftAt || new Date(Date.now() - 72 * 60 * 60_000).toISOString(),
    staleReason: input.reason || list[idx].staleReason || 'Campaign copy stale',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('content-queue', list);
  appendAudit({ actor, action: 'content.stale_draft', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, content: list[idx], overview: contentSummary() };
}

export function publishContentItem(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.title && x.title === input.title));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'published');
  if (idx < 0) return { ok: false, error: 'Publish edilecek content yok' };
  list[idx] = {
    ...list[idx],
    status: 'published',
    staleDraft: false,
    publishedAt: input.publishedAt || new Date().toISOString(),
    publishedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('content-queue', list);
  appendAudit({ actor, action: 'content.publish', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, content: list[idx], overview: contentSummary() };
}

export function seedCampaignPost(input = {}, actor = 'system') {
  const content = createContent(
    {
      title: input.title || 'Campaign post',
      channel: input.channel || 'instagram',
      status: input.status || 'draft',
    },
    actor,
  );
  const patched = updateContent(
    content.id,
    {
      campaignPost: true,
      kind: 'campaign',
      campaign: input.campaign || 'Sunset campaign',
      draftAt: input.draftAt || new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'content.seed_campaign_post', detail: content.title, meta: { id: content.id } });
  return { ok: true, content: patched || content, overview: contentSummary() };
}
