/**
 * AŞAMA 900 — Olympus checkpoint.
 */
import { buildMonument } from './monument.js';
import { storyvaultSummary } from './storyvault.js';
import { holdingsealSummary } from './holdingseal.js';
import { finalbriefSummary } from './finalbrief.js';
import { eternallogSummary } from './eternallog.js';
import { constellateSummary } from './constellate.js';
import { aegisfinalSummary } from './aegisfinal.js';

export function buildOlympus() {
  const prev = buildMonument();
  const s0 = storyvaultSummary();
  const s1 = holdingsealSummary();
  const s2 = finalbriefSummary();
  const s3 = eternallogSummary();
  const s4 = constellateSummary();
  const s5 = aegisfinalSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Olympus",
    monument: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    storyvaultSig: s0.idle || 0,
    holdingsealSig: s1.open || 0,
    finalbriefSig: s2.draft || 0,
    eternallogSig: s3.planned || 0,
    constellateSig: s4.idle || 0,
    aegisfinalSig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Story Vault ${s0.idle || 0} · Holding Seal ${s1.open || 0}`,
      `Final Brief ${s2.draft || 0} · Eternal Log ${s3.planned || 0}`,
      `Constellate ${s4.idle || 0} · Aegis Final ${s5.open || 0}`,
    ],
  };
}
