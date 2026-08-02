/**
 * AŞAMA 8 — Operasyon raporu + ETHOS uyum skoru.
 */

import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit, readAudit } from './audit.js';
import { cancelJob, createJob, jobsSummary, listJobs, updateJob } from './jobs.js';
import { getPublicSettings } from './settings.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ethosScoreFromArchive(archive) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let missing = 0;
  const samples = [];

  for (const entry of archive) {
    const ethos = (entry.steps ?? []).find(
      (s) =>
        String(s.agentId || '').toLowerCase() === 'ethos' ||
        String(s.agentName || '').toUpperCase() === 'ETHOS',
    );
    if (!ethos) {
      missing += 1;
      continue;
    }
    total += 1;
    const out = String(ethos.output || '');
    const ok =
      ethos.status === 'tamamlandi' &&
      (/ONAY/i.test(out) || /✓/.test(out) || /uygun/i.test(out)) &&
      ethos.status !== 'hata';
    if (ethos.status === 'hata' || /RED|REDDET|UYGUN DEĞİL/i.test(out)) {
      failed += 1;
      samples.push({ id: entry.id, text: entry.text, verdict: 'red', at: entry.completedAt });
    } else if (ok || ethos.status === 'tamamlandi') {
      passed += 1;
      if (samples.length < 5) {
        samples.push({ id: entry.id, text: entry.text, verdict: 'onay', at: entry.completedAt });
      }
    } else {
      missing += 1;
    }
  }

  const scored = passed + failed;
  const score = scored === 0 ? null : Math.round((passed / scored) * 100);
  return {
    score,
    passed,
    failed,
    missing,
    totalWithEthos: total,
    archiveSize: archive.length,
    samples: samples.slice(0, 8),
    grade:
      score == null
        ? 'veri-yok'
        : score >= 90
          ? 'A'
          : score >= 75
            ? 'B'
            : score >= 60
              ? 'C'
              : 'D',
    masterRule: 'Centilmenlik · Naiflik · Esprili Üslup',
  };
}

export function buildOpsReport() {
  const archive = readCollection('archive', []);
  const whatsapp = readCollection('whatsapp', []);
  const nexus = readCollection('nexus-events', []);
  const audit = readAudit(100);
  const jobs = jobsSummary();
  const settings = getPublicSettings();
  const ethos = ethosScoreFromArchive(archive);

  const agentHits = {};
  for (const e of archive) {
    for (const a of e.agents ?? []) agentHits[a] = (agentHits[a] ?? 0) + 1;
  }

  const flags = readCollection('report-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const backlog =
    (jobs.byStatus?.scheduled || 0) +
    (jobs.byStatus?.ready || 0) +
    (jobs.byStatus?.failed || 0) +
    (jobs.byStatus?.queued || 0);

  const generatedAt = new Date().toISOString();
  return {
    title: 'LİKYA Holding Operasyon Raporu',
    generatedAt,
    period: {
      from: archive.at(-1)?.issuedAt ?? audit.at(-1)?.at ?? generatedAt,
      to: generatedAt,
    },
    counts: {
      archive: archive.length,
      whatsapp: whatsapp.length,
      nexus: nexus.length,
      audit: audit.length,
      jobs: jobs.total,
      jobsByStatus: jobs.byStatus,
      settingsConfigured: settings.fields.filter((f) => f.configured).length,
      settingsTotal: settings.fields.length,
    },
    ethos,
    topAgents: Object.entries(agentHits)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    recentArchive: archive.slice(0, 10).map((e) => ({
      id: e.id,
      text: e.text,
      status: e.status,
      agents: e.agents,
      completedAt: e.completedAt,
    })),
    recentWhatsapp: whatsapp.slice(0, 8).map((m) => ({
      id: m.id,
      body: m.body,
      provider: m.provider,
      status: m.status,
      at: m.at,
    })),
    recentAudit: audit.slice(0, 15),
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      archive: archive.length,
      jobs_backlog: backlog,
      ethos_grade: ethos.grade,
      ethos_failed: ethos.failed || 0,
    },
    summaryLines: [
      `ETHOS ${ethos.score ?? '—'} · ${ethos.grade}`,
      `Arşiv ${archive.length} · görev backlog ${backlog}`,
      `Flag ${openFlags.length} açık`,
    ],
  };
}

export function runReportSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildOpsReport();
  const existing = readCollection('report-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  const grade = o.ethos?.grade || o.summary?.ethos_grade;
  if (force || grade === 'D' || grade === 'C') {
    candidates.push({
      key: 'ethos',
      level: grade === 'D' ? 'alert' : 'warn',
      text: `ETHOS not ${grade} · red ${o.summary?.ethos_failed || 0}`,
      domain: 'ethos',
    });
  }
  if (force || (o.summary?.jobs_backlog || 0) > 0) {
    candidates.push({
      key: 'jobs',
      level: 'warn',
      text: `Görev backlog ${o.summary?.jobs_backlog || 0}`,
      domain: 'jobs',
    });
  }
  if (force || (o.summary?.archive || 0) === 0) {
    candidates.push({
      key: 'archive',
      level: 'info',
      text: `Arşiv boş veya seyrek (${o.summary?.archive || 0})`,
      domain: 'archive',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Report heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('rpf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('report-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `report sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('rps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('report-sweeps', sweep, 80);
  appendAudit({ actor, action: 'report.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildOpsReport() };
}

export function ackReportFlag(input = {}, actor = 'system') {
  const list = readCollection('report-flags', []) || [];
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
  writeCollection('report-flags', list);
  appendAudit({ actor, action: 'report.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildOpsReport() };
}

export function cancelReportJobs(input = {}, actor = 'system') {
  const backlog = listJobs().filter((j) =>
    ['scheduled', 'ready', 'failed', 'queued'].includes(j.status),
  );
  const cancelled = [];
  for (const j of backlog.slice(0, Number(input.limit) || 20)) {
    if (input.id && j.id !== input.id) continue;
    const next = cancelJob(j.id, actor) || updateJob(j.id, { status: 'cancelled' });
    if (next) cancelled.push(next.id);
  }
  if (!cancelled.length) {
    const seeded = createJob({
      kind: 'directive.queue',
      title: 'report-seed backlog',
      payload: { text: 'report cancel seed' },
      createdBy: actor,
    });
    const next = cancelJob(seeded.id, actor);
    if (next) cancelled.push(next.id);
    else cancelled.push(seeded.id);
  }
  appendAudit({ actor, action: 'report.jobs_cancel', detail: `${cancelled.length}`, meta: { n: cancelled.length } });
  return { ok: true, cancelled, overview: buildOpsReport() };
}

export function ackReportEthos(input = {}, actor = 'system') {
  const overview = buildOpsReport();
  const failed = (overview.ethos?.samples || []).filter((s) => s.verdict === 'red');
  const list = readCollection('report-flags', []) || [];
  const arr = Array.isArray(list) ? list : [];
  const note = String(input.note || 'ETHOS fail ack').slice(0, 240);
  const row = {
    id: rid('rpe'),
    key: 'ethos_ack',
    level: failed.length ? 'alert' : 'info',
    text: failed.length
      ? `ETHOS red ack · ${failed.length} örnek`
      : `ETHOS review ack · grade ${overview.ethos?.grade || '?'}`,
    domain: 'ethos',
    status: 'acked',
    note,
    at: new Date().toISOString(),
    acked_at: new Date().toISOString(),
    acked_by: actor,
    actor,
    samples: failed.slice(0, 5).map((s) => s.id),
  };
  arr.unshift(row);
  writeCollection('report-flags', arr.slice(0, 200));
  enqueueAgentJob(
    {
      agent: 'ETHOS',
      title: `report ethos review · ${failed.length} fail`,
      priority: failed.length ? 'high' : 'normal',
      payload: { flag_id: row.id, failed: failed.length },
    },
    actor,
  );
  appendAudit({ actor, action: 'report.ethos_ack', detail: row.text, meta: { id: row.id } });
  return { ok: true, flag: row, overview: buildOpsReport() };
}

export function snapshotReportAudit(input = {}, actor = 'system') {
  const overview = buildOpsReport();
  const snap = {
    id: rid('rpsnap'),
    at: new Date().toISOString(),
    actor,
    note: String(input.note || '').slice(0, 240) || undefined,
    counts: overview.counts,
    ethos: {
      score: overview.ethos?.score,
      grade: overview.ethos?.grade,
      failed: overview.ethos?.failed,
      passed: overview.ethos?.passed,
    },
    summary: overview.summary,
    summaryLines: (overview.summaryLines || []).slice(0, 6),
  };
  prependItem('report-snapshots', snap, 60);
  appendAudit({ actor, action: 'report.snapshot', detail: snap.id, meta: { id: snap.id } });
  return { ok: true, snapshot: snap, overview: buildOpsReport() };
}

export function reportToMarkdown(report) {
  const e = report.ethos;
  const lines = [
    `# ${report.title}`,
    ``,
    `Üretilme: ${report.generatedAt}`,
    `Dönem: ${report.period.from} → ${report.period.to}`,
    ``,
    `## Özet`,
    ``,
    `| Metrik | Değer |`,
    `| --- | --- |`,
    `| Zincir arşivi | ${report.counts.archive} |`,
    `| WhatsApp | ${report.counts.whatsapp} |`,
    `| NEXUS | ${report.counts.nexus} |`,
    `| Audit | ${report.counts.audit} |`,
    `| Görevler | ${report.counts.jobs} |`,
    `| Ayarlar | ${report.counts.settingsConfigured}/${report.counts.settingsTotal} |`,
    ``,
    `## ETHOS Uyum`,
    ``,
    `Master Kural: **${e.masterRule}**`,
    ``,
    `- Skor: **${e.score ?? '—'}** / 100 (not: ${e.grade})`,
    `- Onay: ${e.passed} · Red: ${e.failed} · Eksik: ${e.missing}`,
    ``,
    `## Ajan Aktivitesi`,
    ``,
    ...(report.topAgents.length
      ? report.topAgents.map((a) => `- ${a.agent}: ${a.count}`)
      : ['- Veri yok']),
    ``,
    `## Son Talimatlar`,
    ``,
    ...report.recentArchive.map(
      (x) =>
        `- [${x.status}] ${x.text} _(ajanlar: ${(x.agents ?? []).join(' → ')})_`,
    ),
    ``,
    `## Son Audit`,
    ``,
    ...report.recentAudit.map(
      (a) => `- ${a.at} · ${a.actor} · \`${a.action}\` — ${a.detail}`,
    ),
    ``,
    `---`,
    `_OlymposPass / LİKYA CEO Paneli · AŞAMA 8_`,
  ];
  return lines.join('\n');
}
