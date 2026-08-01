/**
 * AŞAMA 1125 — Gaia checkpoint.
 */
import { buildSelene } from './selene.js';
import { legacyflag3Summary } from './legacyflag3.js';
import { quiethours3Summary } from './quiethours3.js';
import { pillowmenu4Summary } from './pillowmenu4.js';
import { sleepscore3Summary } from './sleepscore3.js';
import { farewell3Summary } from './farewell3.js';
import { carecall3Summary } from './carecall3.js';

export function buildGaia() {
  const prev = buildSelene();
  const s0 = legacyflag3Summary();
  const s1 = quiethours3Summary();
  const s2 = pillowmenu4Summary();
  const s3 = sleepscore3Summary();
  const s4 = farewell3Summary();
  const s5 = carecall3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Gaia",
    selene: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    legacyflag3Sig: s0.open || 0,
    quiethours3Sig: s1.draft || 0,
    pillowmenu4Sig: s2.planned || 0,
    sleepscore3Sig: s3.idle || 0,
    farewell3Sig: s4.open || 0,
    carecall3Sig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Legacy Flag ${s0.open || 0} · Quiet Hours ${s1.draft || 0}`,
      `Pillow Menu ${s2.planned || 0} · Sleep Score ${s3.idle || 0}`,
      `Farewell ${s4.open || 0} · Care Call ${s5.draft || 0}`,
    ],
  };
}
