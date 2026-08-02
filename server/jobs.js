/**
 * AŞAMA 6 — Zamanlanmış görevler & talimat kuyruğu.
 *
 * job türleri:
 *  - whatsapp.reminder  → dueAt gelince /api/whatsapp mantığıyla mock/canlı gönderim
 *  - directive.queue    → CEO talimat kuyruğu (işlenmeyi bekleyen metinler)
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

export function listJobs(filter = {}) {
  let jobs = readCollection('jobs', []);
  if (filter.status) jobs = jobs.filter((j) => j.status === filter.status);
  if (filter.kind) jobs = jobs.filter((j) => j.kind === filter.kind);
  return jobs;
}

export function getJob(id) {
  return listJobs().find((j) => j.id === id) ?? null;
}

export function createJob(input) {
  const now = new Date().toISOString();
  const job = {
    id: newId('job'),
    kind: input.kind,
    status: 'scheduled',
    title: input.title || input.kind,
    payload: input.payload || {},
    dueAt: input.dueAt || now,
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy || 'system',
    result: null,
    error: null,
  };
  prependItem('jobs', job, 200);
  appendAudit({
    actor: job.createdBy,
    action: 'jobs.create',
    detail: `${job.kind}: ${job.title}`,
    meta: { id: job.id, dueAt: job.dueAt },
  });
  return job;
}

export function updateJob(id, patch) {
  const jobs = listJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  jobs[idx] = {
    ...jobs[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('jobs', jobs);
  return jobs[idx];
}

export function cancelJob(id, actor = 'system') {
  const job = updateJob(id, { status: 'cancelled' });
  if (job) {
    appendAudit({
      actor,
      action: 'jobs.cancel',
      detail: `${job.kind}: ${job.title}`,
      meta: { id },
    });
  }
  return job;
}

const JOBS_FLAGS_COLLECTION = 'jobs-flags';
const JOBS_SWEEPS_COLLECTION = 'jobs-sweeps';

function openJobsFlags() {
  const flags = readCollection(JOBS_FLAGS_COLLECTION, []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function jobAgeMinutes(job, now = Date.now()) {
  const stamp = new Date(job.updatedAt || job.createdAt || job.dueAt || 0).getTime();
  if (!Number.isFinite(stamp)) return 0;
  return Math.max(0, Math.floor((now - stamp) / 60_000));
}

export function runJobsSweep(input = {}, actor = 'system') {
  const now = Date.now();
  const force = !!input.force;
  const failedAgeMinutes = Number(input.failedAgeMinutes ?? input.failedMinutes ?? 24 * 60);
  const runningAgeMinutes = Number(input.runningAgeMinutes ?? input.stuckMinutes ?? 15);
  const queuedBacklogLimit = Number(input.queuedBacklogLimit ?? input.backlogLimit ?? 5);
  const jobs = listJobs();
  const failedAging = jobs.filter(
    (j) => j.status === 'failed' && jobAgeMinutes(j, now) >= failedAgeMinutes,
  );
  const stuckRunning = jobs.filter(
    (j) => j.status === 'running' && jobAgeMinutes(j, now) >= runningAgeMinutes,
  );
  const queuedBacklog = jobs.filter(
    (j) =>
      j.status === 'queued' ||
      (j.status === 'scheduled' && new Date(j.dueAt).getTime() <= now),
  );
  const existing = readCollection(JOBS_FLAGS_COLLECTION, []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];

  if (force || failedAging.length > 0) {
    candidates.push({
      key: 'failed_aging',
      level: failedAging.length > 0 ? 'warn' : 'info',
      text: `Failed aging ${failedAging.length}`,
      domain: 'failed',
      jobIds: failedAging.slice(0, 12).map((j) => j.id),
    });
  }
  if (force || stuckRunning.length > 0) {
    candidates.push({
      key: 'stuck_running',
      level: stuckRunning.length > 0 ? 'alert' : 'info',
      text: `Stuck running ${stuckRunning.length}`,
      domain: 'running',
      jobIds: stuckRunning.slice(0, 12).map((j) => j.id),
    });
  }
  if (force || queuedBacklog.length > queuedBacklogLimit) {
    candidates.push({
      key: 'queued_backlog',
      level: queuedBacklog.length > queuedBacklogLimit ? 'warn' : 'info',
      text: `Queued backlog ${queuedBacklog.length}`,
      domain: 'queued',
      jobIds: queuedBacklog.slice(0, 12).map((j) => j.id),
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Jobs heartbeat OK', domain: 'system' });
  }

  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = {
      id: newId('jbf'),
      ...c,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }

  writeCollection(JOBS_FLAGS_COLLECTION, list.slice(0, 200));
  const sweep = {
    id: newId('jbs'),
    created: created.length,
    failedAging: failedAging.length,
    stuckRunning: stuckRunning.length,
    queuedBacklog: queuedBacklog.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem(JOBS_SWEEPS_COLLECTION, sweep, 80);
  appendAudit({
    actor,
    action: 'jobs.sweep',
    detail: `${created.length} flag`,
    meta: { id: sweep.id, failedAging: failedAging.length, stuckRunning: stuckRunning.length },
  });
  return { ok: true, sweep, created, overview: jobsSummary() };
}

export function ackJobsFlag(input = {}, actor = 'system') {
  const flags = readCollection(JOBS_FLAGS_COLLECTION, []) || [];
  if (!Array.isArray(flags) || !flags.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = flags.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = flags.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = flags.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  flags[idx] = {
    ...flags[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection(JOBS_FLAGS_COLLECTION, flags);
  appendAudit({ actor, action: 'jobs.ack', detail: flags[idx].text, meta: { id: flags[idx].id } });
  return { ok: true, flag: flags[idx], overview: jobsSummary() };
}

export async function retryFailedJob(input = {}, actor = 'system') {
  let job = input.id ? getJob(input.id) : listJobs({ status: 'failed' })[0];
  if (job && job.status !== 'failed') return { ok: false, error: 'Görev failed durumunda değil', job };
  if (!job) {
    job = createJob({
      kind: input.kind || 'directive.queue',
      title: input.title || 'jobs retry seed',
      payload: input.payload || { text: 'jobs retry seed' },
      dueAt: input.dueAt || new Date().toISOString(),
      createdBy: actor,
    });
    job = updateJob(job.id, { status: 'failed', error: 'seeded failed job' });
  }
  const dueAt =
    input.dueAt ||
    new Date(Date.now() + Math.max(0, Number(input.delayMinutes || 0)) * 60_000).toISOString();
  const retry = updateJob(job.id, {
    status: 'scheduled',
    dueAt,
    error: null,
    result: {
      ...(job.result && typeof job.result === 'object' ? job.result : {}),
      retriedAt: new Date().toISOString(),
      retriedBy: actor,
    },
  });
  appendAudit({
    actor,
    action: 'jobs.retry_failed',
    detail: `${retry.kind}: ${retry.title}`,
    meta: { id: retry.id, dueAt },
  });
  if (input.runNow === true) {
    const ran = await runJob(retry.id, actor);
    return { ok: true, job: ran, retried: retry.id, overview: jobsSummary() };
  }
  return { ok: true, job: retry, retried: retry.id, overview: jobsSummary() };
}

export function purgeFailedJobs(input = {}, actor = 'system') {
  let failed = listJobs({ status: 'failed' });
  if (input.id) failed = failed.filter((j) => j.id === input.id);
  if (!failed.length && !input.id) {
    const seeded = createJob({
      kind: 'directive.queue',
      title: input.title || 'jobs purge seed',
      payload: input.payload || { text: 'jobs purge seed' },
      createdBy: actor,
    });
    updateJob(seeded.id, { status: 'failed', error: 'seeded failed job' });
    failed = [getJob(seeded.id)].filter(Boolean);
  }
  const cancelled = [];
  for (const job of failed.slice(0, Number(input.limit) || 20)) {
    const next = cancelJob(job.id, actor) || updateJob(job.id, { status: 'cancelled' });
    if (next) cancelled.push(next.id);
  }
  appendAudit({
    actor,
    action: 'jobs.purge_failed',
    detail: `${cancelled.length}`,
    meta: { n: cancelled.length },
  });
  return { ok: true, cancelled, overview: jobsSummary() };
}

export function seedQueuedJob(input = {}, actor = 'system') {
  const job = createJob({
    kind: input.kind || 'directive.queue',
    title: input.title || 'Queued ops job',
    payload: input.payload || { text: input.text || 'Queued ops directive' },
    dueAt: input.dueAt || new Date(Date.now() + 10 * 60_000).toISOString(),
    createdBy: actor,
  });
  const queued = updateJob(job.id, {
    status: 'queued',
    result: null,
    error: null,
  });
  appendAudit({
    actor,
    action: 'jobs.seed_queued',
    detail: `${queued.kind}: ${queued.title}`,
    meta: { id: queued.id },
  });
  return { ok: true, job: queued, overview: jobsSummary() };
}

/**
 * Hazır talimatı Komuta Merkezi'ne teslim et.
 * scheduled ise önce ready yapar, sonra claimed işaretler.
 */
export async function claimDirective(id, actor = 'system') {
  let job = getJob(id);
  if (!job || job.kind !== 'directive.queue') return null;
  if (job.status === 'claimed' || job.status === 'done' || job.status === 'cancelled') {
    return { error: `Görev durumu claim için uygun değil: ${job.status}`, job };
  }
  if (job.status === 'scheduled') {
    job = (await runJob(id, actor)) ?? job;
  }
  if (job.status !== 'ready' && job.status !== 'claimed') {
    // runJob ready yapar; failed ise dur
    if (job.status === 'failed') return { error: job.error || 'Görev başarısız', job };
  }
  const text = String(job.payload?.text || job.title || '').trim();
  if (!text) return { error: 'Talimat metni boş', job };

  const claimed = updateJob(id, {
    status: 'claimed',
    result: {
      ...(job.result && typeof job.result === 'object' ? job.result : {}),
      claimedBy: actor,
      claimedAt: new Date().toISOString(),
      text,
    },
  });
  appendAudit({
    actor,
    action: 'jobs.claim',
    detail: `Komuta'ya alındı: ${text.slice(0, 80)}`,
    meta: { id },
  });
  return { job: claimed, text };
}

export function deleteJob(id) {
  const next = listJobs().filter((j) => j.id !== id);
  writeCollection('jobs', next);
  return next;
}

/** WhatsApp gönderimi — integrations ile aynı öncelik (Twilio → Meta → mock). */
async function sendWhatsapp(payload) {
  const to = payload.to || process.env.WHATSAPP_DEFAULT_TO || '+905551112233';
  const body = payload.body || 'LİKYA hatırlatması';

  // Twilio
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (sid && token && from) {
    const dest = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const params = new URLSearchParams({ To: dest, From: from, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        signal: AbortSignal.timeout(10000),
      },
    );
    if (res.ok) {
      const data = await res.json();
      return { provider: 'twilio', sid: data.sid, status: data.status, live: true };
    }
  }

  // Meta
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  if (metaToken && phoneId) {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'text',
        text: { body },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        provider: 'meta',
        sid: data.messages?.[0]?.id || `meta_${Date.now()}`,
        status: 'sent',
        live: true,
      };
    }
  }

  return {
    provider: 'mock',
    sid: `mock_job_${Date.now()}`,
    status: 'simulated',
    live: false,
    note: 'API anahtarı yok — zamanlanmış mesaj simüle edildi',
  };
}

async function runWhatsappJob(job) {
  const result = await sendWhatsapp(job.payload || {});
  const entry = {
    id: result.sid,
    to: job.payload?.to || 'default',
    guest: job.payload?.guest ?? null,
    orderId: job.payload?.orderId ?? null,
    kind: 'scheduled',
    body: job.payload?.body || job.title,
    provider: result.provider,
    status: result.status,
    note: result.note,
    at: new Date().toISOString(),
    jobId: job.id,
  };
  prependItem('whatsapp', entry, 100);
  appendAudit({
    actor: 'REMINDER-AI',
    action: 'whatsapp.send',
    detail: String(entry.body).slice(0, 100),
    meta: { provider: entry.provider, status: entry.status, jobId: job.id },
  });
  return result;
}

async function runDirectiveJob(job) {
  // Kuyruk kaydı "ready" olur — UI Komuta Merkezi'nden alır
  return {
    queued: true,
    text: job.payload?.text || job.title,
    note: 'Talimat hazır — Komuta Merkezi veya Hub üzerinden işlenebilir',
  };
}

export async function runJob(id, actor = 'scheduler') {
  const job = getJob(id);
  if (!job) return null;
  if (job.status === 'cancelled' || job.status === 'done') return job;

  updateJob(id, { status: 'running' });
  try {
    let result;
    if (job.kind === 'whatsapp.reminder') {
      result = await runWhatsappJob(job);
    } else if (job.kind === 'directive.queue') {
      result = await runDirectiveJob(job);
    } else {
      throw new Error(`Bilinmeyen job türü: ${job.kind}`);
    }
    const done = updateJob(id, {
      status: job.kind === 'directive.queue' ? 'ready' : 'done',
      result,
      error: null,
    });
    appendAudit({
      actor,
      action: 'jobs.run',
      detail: `${job.kind} → ${done.status}`,
      meta: { id, result },
    });
    return done;
  } catch (err) {
    const failed = updateJob(id, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    });
    appendAudit({
      actor,
      action: 'jobs.failed',
      detail: failed.error,
      meta: { id },
    });
    return failed;
  }
}

/** dueAt geçmiş scheduled işleri çalıştır. */
export async function tickJobs() {
  const now = Date.now();
  const due = listJobs().filter(
    (j) => j.status === 'scheduled' && new Date(j.dueAt).getTime() <= now,
  );
  const results = [];
  for (const job of due) {
    results.push(await runJob(job.id, 'scheduler'));
  }
  return results;
}

let ticker = null;

export function startJobTicker(intervalMs = 5000) {
  if (ticker) return;
  ticker = setInterval(() => {
    void tickJobs().catch(() => undefined);
    // Ajan kuyruğu nabız — dinamik import (döngüsel bağımlılık yok)
    void import('./agentqueue.js')
      .then((m) => m.tickAgentQueue('scheduler'))
      .catch(() => undefined);
    // Kampüs çapraz otomasyon (seyrek — her tick’te dedupe var)
    void import('./campusbrief.js')
      .then((m) => m.runCampusAutomations('scheduler'))
      .catch(() => undefined);
  }, intervalMs);
  // unref so it doesn't keep process alive unnecessarily in some envs
  if (typeof ticker.unref === 'function') ticker.unref();
}

export function jobsSummary() {
  const jobs = listJobs();
  const byStatus = {};
  for (const j of jobs) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
  const now = Date.now();
  const flags = openJobsFlags();
  const overdueScheduled = jobs.filter(
    (j) => j.status === 'scheduled' && new Date(j.dueAt).getTime() <= now,
  );
  const stuckRunning = jobs.filter((j) => j.status === 'running' && jobAgeMinutes(j, now) >= 15);
  return {
    total: jobs.length,
    byStatus,
    flags,
    upcoming: jobs
      .filter((j) => j.status === 'scheduled')
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      .slice(0, 8),
    readyDirectives: jobs.filter((j) => j.kind === 'directive.queue' && j.status === 'ready'),
    recent: jobs.slice(0, 10),
    summary: {
      flags_open: flags.length,
      failed: byStatus.failed ?? 0,
      queued: byStatus.queued ?? 0,
      running: byStatus.running ?? 0,
      overdue_scheduled: overdueScheduled.length,
      stuck_running: stuckRunning.length,
    },
    summaryLines: [
      `Görev ${jobs.length} · failed ${byStatus.failed ?? 0} · queued ${byStatus.queued ?? 0}`,
      `Overdue scheduled ${overdueScheduled.length} · stuck running ${stuckRunning.length}`,
      `Jobs flag ${flags.length} açık`,
    ],
  };
}
