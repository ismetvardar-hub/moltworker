/**
 * AŞAMA 405 — Odyssey checkpoint.
 */
import { buildZenith } from './zenith.js';
import { okrrackSummary } from './okrrack.js';
import { betboardSummary } from './betboard.js';
import { portfolioriskSummary } from './portfoliorisk.js';
import { expansionSummary } from './expansion.js';
import { moatwatchSummary } from './moatwatch.js';
import { northstarSummary } from './northstar.js';

export function buildOdyssey() {
  const prev = buildZenith();
  const okr = okrrackSummary();
  const bet = betboardSummary();
  const risk = portfolioriskSummary();
  const exp = expansionSummary();
  const moat = moatwatchSummary();
  const star = northstarSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Odyssey",
    zenith: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    okrRisk: okr.at_risk || 0,
    betsOpen: bet.open || 0,
    riskHigh: risk.high || 0,
    expansionScout: exp.scout || 0,
    moatEroding: moat.eroding || 0,
    starMiss: star.miss || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `OKR at risk ${okr.at_risk || 0} · Strategic bets open ${bet.open || 0}`,
      `Portfolio risk high ${risk.high || 0} · Expansion scout ${exp.scout || 0}`,
      `Moat eroding ${moat.eroding || 0} · North star miss ${star.miss || 0}`,
    ],
  };
}
