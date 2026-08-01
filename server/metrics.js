/**
 * AŞAMA 15 — Gözlemlenebilirlik / operasyon metrikleri.
 */

import { readCollection } from './store.js';
import { healthCheck } from './ops.js';
import { jobsSummary } from './jobs.js';
import { passStats } from './pass.js';
import { venuesSummary } from './venues.js';
import { unreadCount } from './notifications.js';
import { sseClientCount } from './events.js';

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

  return {
    generatedAt: new Date().toISOString(),
    health: health.status,
    uptimeSec: health.uptimeSec,
    sseClients: sseClientCount(),
    unreadNotifications: unreadCount(),
    chain: archiveMetrics(archive),
    pass,
    jobs: {
      total: jobs.total,
      byStatus: jobs.byStatus,
      ready: jobs.readyDirectives?.length ?? 0,
      scheduled: jobs.byStatus?.scheduled ?? 0,
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
  };
}
