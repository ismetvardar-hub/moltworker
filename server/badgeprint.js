/**
 * Wave 176 - Badge print queue ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('badge-prints', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bad_1',
      holderName: "İsim",
      reason: "kayıp",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('badge-prints', seed);
    return seed;
  }
  return list;
}

function openBadgeprintFlags() {
  const flags = readCollection('badgeprint-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBadgeprintFlag(candidate, actor = 'system') {
  const existing = readCollection('badgeprint-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bpf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('badgeprint-flags', list.slice(0, 200));
  return flag;
}

function isQueueJam(row) {
  return row.queueJam === true || row.status === 'jammed' || row.status === 'queue_jam';
}

function isReprint(row) {
  return row.reprint === true || row.status === 'reprinted' || row.reason === 'reprint';
}

function isEventBadge(row) {
  return row.eventBadge === true || row.batchType === 'event_badges';
}

export function listBadgeprint(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBadgeprint(input = {}, actor = 'system') {
  const row = {
    id: rid('bad'),
    holderName: input.holderName !== undefined ? input.holderName : "İsim",
    reason: input.reason !== undefined ? input.reason : "kayıp",
    eventName: input.eventName !== undefined ? input.eventName : undefined,
    batchType: input.batchType !== undefined ? input.batchType : undefined,
    qty: input.qty !== undefined ? Number(input.qty) || 0 : undefined,
    eventBadge: input.eventBadge === true || undefined,
    status: input.status || 'queued',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('badge-prints', row, 300);
  appendAudit({
    actor,
    action: 'badgeprint.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBadgeprint(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  list[idx] = next;
  writeCollection('badge-prints', list);
  appendAudit({ actor, action: 'badgeprint.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function badgeprintSummary() {
  const list = listBadgeprint();
  const queueJams = list.filter(isQueueJam);
  const reprints = list.filter(isReprint);
  const eventBadges = list.filter(isEventBadge);
  const flags = openBadgeprintFlags();
  return {
    title: 'LIKYA Badge Print Ops',
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    printed: list.filter((x) => x.status === 'printed').length,
    jammed: queueJams.length,
    reprints: reprints.length,
    eventBadges: eventBadges.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      queued: list.filter((x) => x.status === 'queued').length,
      printed: list.filter((x) => x.status === 'printed').length,
      jammed: queueJams.length,
      reprints: reprints.length,
      event_badges: eventBadges.length,
    },
    summaryLines: [
      `Badge print ${list.length} job - jam ${queueJams.length} - reprint ${reprints.length}`,
      `Queued ${list.filter((x) => x.status === 'queued').length} - event badges ${eventBadges.length} - flag ${flags.length}`,
    ],
    jobs: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBadgeprintSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = badgeprintSummary();
  const created = [];
  const candidates = [];
  if (force || overview.jammed > 0) {
    candidates.push({
      key: 'badgeprint_queue_jam',
      level: overview.jammed > 0 ? 'warn' : 'info',
      text: `Badge print queue jams ${overview.jammed}`,
      domain: 'queue',
    });
  }
  if (force || overview.reprints === 0) {
    candidates.push({
      key: 'badgeprint_reprint_needed',
      level: overview.reprints === 0 ? 'warn' : 'info',
      text: `Badge print reprints ${overview.reprints}`,
      domain: 'reprint',
    });
  }
  if (force || overview.eventBadges === 0) {
    candidates.push({
      key: 'badgeprint_event_badges_seed',
      level: 'info',
      text: `Badge print event badge batches ${overview.eventBadges}`,
      domain: 'event',
    });
  }
  for (const candidate of candidates) {
    const flag = addBadgeprintFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `badgeprint sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('badgeprint-sweeps', sweep, 80);
  appendAudit({ actor, action: 'badgeprint.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: badgeprintSummary() };
}

export function ackBadgeprintFlag(input = {}, actor = 'system') {
  const list = readCollection('badgeprint-flags', []) || [];
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
  writeCollection('badgeprint-flags', list);
  appendAudit({ actor, action: 'badgeprint.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: badgeprintSummary() };
}

export function markBadgeprintQueueJam(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.holderName && x.holderName === input.holderName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'queued' || !isQueueJam(x));
  if (idx < 0) return { ok: false, error: 'Queue jam yapilacak badge print yok' };
  list[idx] = {
    ...list[idx],
    status: 'queue_jam',
    queueJam: true,
    jamReason: input.reason || input.jamReason || 'printer_spool_blocked',
    jamAt: input.jamAt || new Date().toISOString(),
    jamBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('badge-prints', list);
  appendAudit({ actor, action: 'badgeprint.queue_jam', detail: list[idx].holderName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, job: list[idx], overview: badgeprintSummary() };
}

export function reprintBadge(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.holderName && x.holderName === input.holderName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isQueueJam(x) || x.status === 'printed' || x.status === 'queued');
  if (idx < 0) {
    const job = createBadgeprint({
      holderName: input.holderName || 'Wave 176 Reprint',
      reason: 'reprint',
      status: 'reprinted',
    }, actor);
    return { ok: true, job, overview: badgeprintSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'reprinted',
    reason: 'reprint',
    reprint: true,
    queueJam: false,
    reprintReason: input.reason || input.reprintReason || 'badge_damaged',
    reprintedAt: input.reprintedAt || new Date().toISOString(),
    reprintedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('badge-prints', list);
  appendAudit({ actor, action: 'badgeprint.reprint', detail: list[idx].holderName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, job: list[idx], overview: badgeprintSummary() };
}

export function seedEventBadges(input = {}, actor = 'system') {
  const job = createBadgeprint(
    {
      holderName: input.holderName || 'Wave 176 Event Batch',
      reason: input.reason || 'event_badges',
      eventName: input.eventName || 'Gallery Night',
      batchType: 'event_badges',
      eventBadge: true,
      qty: input.qty ?? 50,
      status: input.status || 'queued',
    },
    actor,
  );
  appendAudit({ actor, action: 'badgeprint.seed_event_badges', detail: job.eventName || job.holderName, meta: { id: job.id } });
  return { ok: true, job, overview: badgeprintSummary() };
}
