/**
 * AŞAMA 15 — Gözlemlenebilirlik / operasyon metrikleri.
 */

import { prependItem, readCollection, writeCollection } from './store.js';
import { healthCheck } from './ops.js';
import { cancelJob, createJob, jobsSummary, listJobs, updateJob } from './jobs.js';
import { passStats } from './pass.js';
import { venuesSummary } from './venues.js';
import { unreadCount } from './notifications.js';
import { sseClientCount } from './events.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function archiveMetrics(archive) {
  let ok = 0;
  let fail = 0;
  let steps = 0;
  let ethosOk = 0;
  let ethosFail = 0;
  const agentFails = {};
  const durations = []; // completedAt - issuedAt ms (yaklaşık)

  for (const e of archive) {
    if (e.status === 'tamamlandi') ok += 1;
    else if (e.status === 'hata') fail += 1;
    steps += (e.steps ?? []).length;
    for (const s of e.steps ?? []) {
      if (String(s.agentName || '').toUpperCase() === 'ETHOS') {
        if (s.status === 'tamamlandi') ethosOk += 1;
        else if (s.status === 'hata') ethosFail += 1;
      }
      if (s.status === 'hata') {
        const name = s.agentName || s.agentId || 'unknown';
        agentFails[name] = (agentFails[name] ?? 0) + 1;
      }
    }
    if (e.issuedAt && e.completedAt) {
      const ms = new Date(e.completedAt) - new Date(e.issuedAt);
      if (Number.isFinite(ms) && ms >= 0 && ms < 1000 * 60 * 60) durations.push(ms);
    }
  }

  const avgMs =
    durations.length === 0
      ? null
      : Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  return {
    archiveTotal: archive.length,
    archiveOk: ok,
    archiveFail: fail,
    successRate: archive.length ? Math.round((ok / archive.length) * 100) : null,
    stepsTotal: steps,
    avgChainMs: avgMs,
    ethosOk,
    ethosFail,
    topFailures: Object.entries(agentFails)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export function buildMetrics() {
  const archive = readCollection('archive', []);
  const whatsapp = readCollection('whatsapp', []);
  const nexus = readCollection('nexus-events', []);
  const audit = readCollection('audit', []);
  const jobs = jobsSummary();
  const pass = passStats();
  const venues = venuesSummary();
  const health = healthCheck();

  const waLive = whatsapp.filter((m) => m.provider && m.provider !== 'mock').length;
  const waMock = whatsapp.length - waLive;
  const chain = archiveMetrics(archive);
  const jobsFailed = jobs.byStatus?.failed ?? 0;
  const jobsQueued = jobs.byStatus?.queued ?? 0;
  const jobsBacklog = jobsFailed + jobsQueued + (jobs.byStatus?.ready ?? 0) + (jobs.byStatus?.scheduled ?? 0);

  const flags = readCollection('metrics-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');

  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Gözlemlenebilirlik',
    health: health.status,
    uptimeSec: health.uptimeSec,
    sseClients: sseClientCount(),
    unreadNotifications: unreadCount(),
    chain,
    pass,
    jobs: {
      total: jobs.total,
      byStatus: jobs.byStatus,
      ready: jobs.readyDirectives?.length ?? 0,
      scheduled: jobs.byStatus?.scheduled ?? 0,
      failed: jobsFailed,
      queued: jobsQueued,
    },
    integrations: {
      whatsappTotal: whatsapp.length,
      whatsappLive: waLive,
      whatsappMock: waMock,
      nexusEvents: nexus.length,
      auditEvents: audit.length,
    },
    venues: {
      total: venues.total,
      active: venues.active,
    },
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      health: health.status,
      success_rate: chain.successRate,
      archive_fail: chain.archiveFail,
      ethos_fail: chain.ethosFail,
      jobs_backlog: jobsBacklog,
      jobs_failed: jobsFailed,
    },
    summaryLines: [
      `Sistem ${String(health.status || '—').toUpperCase()} · uptime ${health.uptimeSec ?? 0}s`,
      `Zincir başarı %${chain.successRate ?? '—'} · hata ${chain.archiveFail}`,
      `ETHOS fail ${chain.ethosFail} · görev backlog ${jobsBacklog}`,
      `Metrik flag ${openFlags.length} açık`,
    ],
  };
}

export function runMetricsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildMetrics();
  const existing = readCollection('metrics-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  const healthBad = o.health && o.health !== 'ok' && o.health !== 'healthy';
  if (force || healthBad) {
    candidates.push({
      key: 'health',
      level: healthBad ? 'alert' : 'info',
      text: `Sistem sağlığı ${o.health || '—'}`,
      domain: 'health',
    });
  }
  if (force || (o.summary?.ethos_fail || 0) > 0 || (o.summary?.archive_fail || 0) > 0) {
    candidates.push({
      key: 'chain',
      level: (o.summary?.ethos_fail || 0) > 0 ? 'alert' : 'warn',
      text: `Zincir hata ${o.summary?.archive_fail || 0} · ETHOS fail ${o.summary?.ethos_fail || 0}`,
      domain: 'chain',
    });
  }
  if (force || (o.summary?.jobs_failed || 0) > 0 || (o.summary?.jobs_backlog || 0) > 0) {
    candidates.push({
      key: 'jobs',
      level: (o.summary?.jobs_failed || 0) > 0 ? 'warn' : 'info',
      text: `Görev fail ${o.summary?.jobs_failed || 0} · backlog ${o.summary?.jobs_backlog || 0}`,
      domain: 'jobs',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Metrics heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('mtf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('metrics-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `metrics sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('mts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('metrics-sweeps', sweep, 80);
  appendAudit({ actor, action: 'metrics.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildMetrics() };
}

export function ackMetricsFlag(input = {}, actor = 'system') {
  const list = readCollection('metrics-flags', []) || [];
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
  writeCollection('metrics-flags', list);
  appendAudit({ actor, action: 'metrics.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildMetrics() };
}

export function snapshotMetrics(input = {}, actor = 'system') {
  const overview = buildMetrics();
  const snap = {
    id: rid('mtsnap'),
    at: new Date().toISOString(),
    actor,
    note: String(input.note || '').slice(0, 240) || undefined,
    health: overview.health,
    chain: {
      successRate: overview.chain?.successRate,
      archiveFail: overview.chain?.archiveFail,
      ethosFail: overview.chain?.ethosFail,
      archiveTotal: overview.chain?.archiveTotal,
    },
    jobs: overview.jobs,
    summary: overview.summary,
    summaryLines: (overview.summaryLines || []).slice(0, 6),
  };
  prependItem('metrics-snapshots', snap, 60);
  appendAudit({ actor, action: 'metrics.snapshot', detail: snap.id, meta: { id: snap.id } });
  return { ok: true, snapshot: snap, overview: buildMetrics() };
}

export function purgeFailedJobs(input = {}, actor = 'system') {
  const backlog = listJobs().filter((j) => ['failed', 'queued'].includes(j.status));
  const cancelled = [];
  for (const j of backlog.slice(0, Number(input.limit) || 20)) {
    if (input.id && j.id !== input.id) continue;
    const next = cancelJob(j.id, actor) || updateJob(j.id, { status: 'cancelled' });
    if (next) cancelled.push(next.id);
  }
  if (!cancelled.length) {
    const seeded = createJob({
      kind: 'directive.queue',
      title: 'metrics-seed failed',
      payload: { text: 'metrics purge seed' },
      createdBy: actor,
    });
    updateJob(seeded.id, { status: 'failed' });
    const next = cancelJob(seeded.id, actor);
    if (next) cancelled.push(next.id);
    else cancelled.push(seeded.id);
  }
  appendAudit({ actor, action: 'metrics.jobs_purge', detail: `${cancelled.length}`, meta: { n: cancelled.length } });
  return { ok: true, cancelled, overview: buildMetrics() };
}

export function ackEthosFails(input = {}, actor = 'system') {
  const overview = buildMetrics();
  const ethosFail = overview.chain?.ethosFail || 0;
  const note = String(input.note || 'ETHOS fail ack').slice(0, 240);
  const row = {
    id: rid('mte'),
    key: 'ethos_ack',
    level: ethosFail > 0 ? 'alert' : 'info',
    text: ethosFail
      ? `ETHOS fail ack · ${ethosFail}`
      : `ETHOS review ack · zincir %${overview.chain?.successRate ?? '—'}`,
    domain: 'ethos',
    status: 'acked',
    note,
    at: new Date().toISOString(),
    acked_at: new Date().toISOString(),
    acked_by: actor,
    actor,
    ethos_fail: ethosFail,
  };
  prependItem('metrics-ethos-acks', row, 120);
  const flags = readCollection('metrics-flags', []) || [];
  const arr = Array.isArray(flags) ? flags : [];
  arr.unshift({ ...row, id: rid('mtf') });
  writeCollection('metrics-flags', arr.slice(0, 200));
  enqueueAgentJob(
    {
      agent: 'ETHOS',
      title: `metrics ethos review · ${ethosFail} fail`,
      priority: ethosFail ? 'high' : 'normal',
      payload: { ack_id: row.id, ethos_fail: ethosFail },
    },
    actor,
  );
  appendAudit({ actor, action: 'metrics.ethos_ack', detail: row.text, meta: { id: row.id } });
  return { ok: true, ack: row, overview: buildMetrics() };
}
