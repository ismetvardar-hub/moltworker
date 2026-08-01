/**
 * AŞAMA 765 — Serenity checkpoint.
 */
import { buildDominion } from './dominion.js';
import { legacyflagSummary } from './legacyflag.js';
import { quiethoursSummary } from './quiethours.js';
import { pillowmenu2Summary } from './pillowmenu2.js';
import { sleepscoreSummary } from './sleepscore.js';
import { farewellSummary } from './farewell.js';
import { carecallSummary } from './carecall.js';

export function buildSerenity() {
  const prev = buildDominion();
  const s0 = legacyflagSummary();
  const s1 = quiethoursSummary();
  const s2 = pillowmenu2Summary();
  const s3 = sleepscoreSummary();
  const s4 = farewellSummary();
  const s5 = carecallSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Serenity",
    dominion: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    legacyflagSig: s0.open || 0,
    quiethoursSig: s1.draft || 0,
    pillowmenu2Sig: s2.planned || 0,
    sleepscoreSig: s3.idle || 0,
    farewellSig: s4.open || 0,
    carecallSig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Legacy Flag ${s0.open || 0} · Quiet Hours ${s1.draft || 0}`,
      `Pillow Menu ${s2.planned || 0} · Sleep Score ${s3.idle || 0}`,
      `Farewell ${s4.open || 0} · Care Call ${s5.draft || 0}`,
    ],
  };
}
