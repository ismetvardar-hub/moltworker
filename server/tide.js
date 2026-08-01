/**
 * AŞAMA 420 — Tide checkpoint.
 */
import { buildOdyssey } from './odyssey.js';
import { tidewatchSummary } from './tidewatch.js';
import { cliffpathSummary } from './cliffpath.js';
import { reefguardSummary } from './reefguard.js';
import { pieropsSummary } from './pierops.js';
import { umbrellamapSummary } from './umbrellamap.js';
import { coastpatrolSummary } from './coastpatrol.js';

export function buildTide() {
  const prev = buildOdyssey();
  const tide = tidewatchSummary();
  const cliff = cliffpathSummary();
  const reef = reefguardSummary();
  const pier = pieropsSummary();
  const umb = umbrellamapSummary();
  const patrol = coastpatrolSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Tide",
    odyssey: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    tideHigh: tide.high || 0,
    pathClosed: cliff.closed || 0,
    reefAlert: reef.alert || 0,
    pierBusy: pier.busy || 0,
    umbOcc: umb.occupied || 0,
    patrolOn: patrol.patrol || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Tide high ${tide.high || 0} · Cliff path closed ${cliff.closed || 0}`,
      `Reef alert ${reef.alert || 0} · Pier busy ${pier.busy || 0}`,
      `Umbrella occupied ${umb.occupied || 0} · Coast patrol ${patrol.patrol || 0}`,
    ],
  };
}
