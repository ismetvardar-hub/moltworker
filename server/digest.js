/**
 * AŞAMA 75 — CEO digest (hazırlık + brief + sinyal birleşimi).
 */
import { buildReadiness, refreshReadinessSnapshot, escalateReadinessGap, resolveReadinessGap } from './readiness.js';
import { buildDailyBrief } from './brief.js';
import { buildWeatherBrief } from './weather.js';
import { feedbackSummary } from './feedback.js';
import { cashSummary } from './cash.js';
import { tipSummary } from './tips.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildDigest() {
  const ready = buildReadiness();
  const brief = buildDailyBrief();
  const weather = buildWeatherBrief();
  const fb = feedbackSummary();
  const cash = cashSummary();
  const tips = tipSummary();
  const flags = readCollection('digest-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const criticalSignals = Object.entries(ready.signals || {}).filter(([, v]) => {
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'boolean') return v;
    return !!v;
  }).length;
  const headlines = brief.headlines || [];
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA CEO Digest',
    readiness: { overall: ready.overall, grade: ready.grade },
    headlines,
    weather: { label: weather.label, tempC: weather.tempC, tip: weather.tip },
    nps: fb.nps,
    cashBalance: cash.drawer?.balance ?? 0,
    tipBalance: tips.balance,
    signals: ready.signals,
    dimensions: ready.dimensions,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      readiness: ready.overall,
      grade: ready.grade,
      headlines: headlines.length,
      critical_signals: criticalSignals,
    },
    summaryLines: [
      `Hazırlık ${ready.overall}/${ready.grade}`,
      ...headlines.slice(0, 3),
      `Sinyal ${criticalSignals} · manşet ${headlines.length}`,
      `Digest flag ${openFlags.length} açık`,
    ],
  };
}

export function runDigestSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildDigest();
  const existing = readCollection('digest-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  const grade = o.readiness?.grade || o.summary?.grade;
  if (force || grade === 'D' || grade === 'C' || (o.summary?.readiness ?? 100) < 70) {
    candidates.push({
      key: 'readiness',
      level: grade === 'D' ? 'alert' : 'warn',
      text: `Hazırlık ${o.summary?.readiness ?? 0}/${grade || '?'}`,
      domain: 'readiness',
    });
  }
  if (force || (o.summary?.critical_signals || 0) > 0) {
    candidates.push({
      key: 'signals',
      level: 'alert',
      text: `Kritik sinyal ${o.summary?.critical_signals || 0}`,
      domain: 'signals',
    });
  }
  if (force || (o.summary?.headlines || 0) > 1) {
    candidates.push({
      key: 'headlines',
      level: 'info',
      text: `Brief manşet ${o.summary?.headlines || 0}`,
      domain: 'brief',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Digest heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('dgf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('digest-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `digest sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('dgs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('digest-sweeps', sweep, 80);
  appendAudit({ actor, action: 'digest.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildDigest() };
}

export function ackDigestFlag(input = {}, actor = 'system') {
  const list = readCollection('digest-flags', []) || [];
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
  writeCollection('digest-flags', list);
  appendAudit({ actor, action: 'digest.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildDigest() };
}

export function refreshDigestReadiness(input = {}, actor = 'system') {
  const result = refreshReadinessSnapshot(input, actor);
  appendAudit({ actor, action: 'digest.readiness_refresh', detail: result.snapshot?.id || 'ok', meta: { id: result.snapshot?.id } });
  return { ok: true, snapshot: result.snapshot, overview: buildDigest() };
}

export function escalateDigestGap(input = {}, actor = 'system') {
  const result = escalateReadinessGap(input, actor);
  if (!result.ok) return { ok: false, error: result.error || 'Escalate başarısız', overview: buildDigest() };
  appendAudit({ actor, action: 'digest.gap_escalate', detail: result.gap?.id || 'ok', meta: { id: result.gap?.id } });
  return { ok: true, gap: result.gap, overview: buildDigest() };
}

export function resolveDigestGap(input = {}, actor = 'system') {
  let result = resolveReadinessGap(input, actor);
  if (!result.ok) {
    escalateReadinessGap(input, actor);
    result = resolveReadinessGap(input, actor);
  }
  if (!result.ok) return { ok: false, error: result.error || 'Gap resolve başarısız', overview: buildDigest() };
  appendAudit({ actor, action: 'digest.gap_resolve', detail: result.gap?.id || 'ok', meta: { id: result.gap?.id } });
  return { ok: true, gap: result.gap, overview: buildDigest() };
}
