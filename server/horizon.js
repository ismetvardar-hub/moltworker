/**
 * AŞAMA 225 — Horizon checkpoint (sentinel + F&B/gelir sinyalleri).
 */
import { buildSentinel } from './sentinel.js';
import { revpulseSummary } from './revpulse.js';
import { voidlogSummary } from './voidlog.js';
import { compsSummary } from './comps.js';
import { tabopenSummary } from './tabopen.js';
import { allergenalertSummary } from './allergenalert.js';
import { tempprobeSummary } from './tempprobe.js';

export function buildHorizon() {
  const sen = buildSentinel();
  const rev = revpulseSummary();
  const voids = voidlogSummary();
  const comps = compsSummary();
  const tabs = tabopenSummary();
  const allergy = allergenalertSummary();
  const probe = tempprobeSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Horizon',
    sentinel: { summaryLines: (sen.summaryLines || []).slice(0, 2) },
    revLive: rev.live || 0,
    voidsOpen: voids.logged || 0,
    compsRequested: comps.requested || 0,
    tabsOpen: tabs.open || 0,
    allergyOpen: allergy.open || 0,
    probeFail: probe.fail || 0,
    summaryLines: [
      ...(sen.summaryLines || []).slice(0, 2),
      `Rev pulse live ${rev.live || 0} · Açık tab ${tabs.open || 0}`,
      `Void logged ${voids.logged || 0} · Comp talep ${comps.requested || 0}`,
      `Alerjen açık ${allergy.open || 0} · Probe fail ${probe.fail || 0}`,
    ],
  };
}
