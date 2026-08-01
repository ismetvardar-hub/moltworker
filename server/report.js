/**
 * AŞAMA 8 — Operasyon raporu + ETHOS uyum skoru.
 */

import { readCollection } from './store.js';
import { readAudit } from './audit.js';
import { jobsSummary } from './jobs.js';
import { getPublicSettings } from './settings.js';

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
  };
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
