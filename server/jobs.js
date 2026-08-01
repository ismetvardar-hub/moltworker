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
  return {
    total: jobs.length,
    byStatus,
    upcoming: jobs
      .filter((j) => j.status === 'scheduled')
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      .slice(0, 8),
    readyDirectives: jobs.filter((j) => j.kind === 'directive.queue' && j.status === 'ready'),
    recent: jobs.slice(0, 10),
  };
}
