/**
 * AŞAMA 315 — Cognisphere checkpoint (brandpulse + AI/ajan ops sinyalleri).
 */
import { buildBrandpulse } from './brandpulse.js';
import { agentevalSummary } from './agenteval.js';
import { tokenbudgetSummary } from './tokenbudget.js';
import { redteamSummary } from './redteam.js';
import { hallucheckSummary } from './hallucheck.js';
import { costguardSummary } from './costguard.js';
import { driftmonitorSummary } from './driftmonitor.js';

export function buildCognisphere() {
  const brand = buildBrandpulse();
  const evals = agentevalSummary();
  const tokens = tokenbudgetSummary();
  const red = redteamSummary();
  const hallu = hallucheckSummary();
  const cost = costguardSummary();
  const drift = driftmonitorSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Cognisphere',
    brandpulse: { summaryLines: (brand.summaryLines || []).slice(0, 2) },
    evalFailed: evals.failed || 0,
    tokenWarn: tokens.warn || 0,
    redOpen: red.open || 0,
    halluFlagged: hallu.flagged || 0,
    costHalt: cost.halt || 0,
    driftActive: drift.drift || 0,
    summaryLines: [
      ...(brand.summaryLines || []).slice(0, 2),
      `Ajan eval fail ${evals.failed || 0} · Token warn ${tokens.warn || 0}`,
      `Red-team açık ${red.open || 0} · Hallucination flagged ${hallu.flagged || 0}`,
      `Cost halt ${cost.halt || 0} · Drift ${drift.drift || 0}`,
    ],
  };
}
