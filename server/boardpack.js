/**
 * AŞAMA 90 — Board pack (digest + readiness + finance sinyalleri).
 */
import { buildDigest } from './digest.js';
import { buildReadiness } from './readiness.js';
import { buildOpsReport } from './report.js';
import { budgetSummary } from './budget.js';
import { contractsSummary } from './contracts.js';

export function buildBoardpack() {
  const digest = buildDigest();
  const ready = buildReadiness();
  const report = buildOpsReport();
  const budget = budgetSummary();
  const contracts = contractsSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Board Pack',
    digest,
    readiness: { overall: ready.overall, grade: ready.grade, dimensions: ready.dimensions },
    ethos: report.ethos || report.scores || null,
    budgetTotal: budget.total,
    contractsTotal: contracts.total,
    renewing: contracts.renewing || 0,
    summaryLines: [
      `Hazırlık ${ready.overall}/${ready.grade}`,
      ...(digest.headlines || []).slice(0, 3),
      `Bütçe kalemi ${budget.total}`,
      `Sözleşme ${contracts.total} (yenileme ${contracts.renewing || 0})`,
    ],
  };
}
