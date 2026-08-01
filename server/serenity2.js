/**
 * AŞAMA 975 — Serenity2 checkpoint.
 */
import { buildDominion2 } from './dominion2.js';
import { legacyflag2Summary } from './legacyflag2.js';
import { quiethours2Summary } from './quiethours2.js';
import { pillowmenu3Summary } from './pillowmenu3.js';
import { sleepscore2Summary } from './sleepscore2.js';
import { farewell2Summary } from './farewell2.js';
import { carecall2Summary } from './carecall2.js';

export function buildSerenity2() {
  const prev = buildDominion2();
  const s0 = legacyflag2Summary();
  const s1 = quiethours2Summary();
  const s2 = pillowmenu3Summary();
  const s3 = sleepscore2Summary();
  const s4 = farewell2Summary();
  const s5 = carecall2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Serenity2",
    dominion2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    legacyflag2Sig: s0.open || 0,
    quiethours2Sig: s1.draft || 0,
    pillowmenu3Sig: s2.planned || 0,
    sleepscore2Sig: s3.idle || 0,
    farewell2Sig: s4.open || 0,
    carecall2Sig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Legacy Flag ${s0.open || 0} · Quiet Hours ${s1.draft || 0}`,
      `Pillow Menu ${s2.planned || 0} · Sleep Score ${s3.idle || 0}`,
      `Farewell ${s4.open || 0} · Care Call ${s5.draft || 0}`,
    ],
  };
}
