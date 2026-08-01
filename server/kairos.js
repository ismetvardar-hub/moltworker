/**
 * AŞAMA 1155 — Kairos checkpoint.
 */
import { buildChronos } from './chronos.js';
import { chaosdrill3Summary } from './chaosdrill3.js';
import { circle3Summary } from './circle3.js';
import { forummod3Summary } from './forummod3.js';
import { badgeearn3Summary } from './badgeearn3.js';
import { volunteer3Summary } from './volunteer3.js';
import { chapter3Summary } from './chapter3.js';

export function buildKairos() {
  const prev = buildChronos();
  const s0 = chaosdrill3Summary();
  const s1 = circle3Summary();
  const s2 = forummod3Summary();
  const s3 = badgeearn3Summary();
  const s4 = volunteer3Summary();
  const s5 = chapter3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Kairos",
    chronos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    chaosdrill3Sig: s0.planned || 0,
    circle3Sig: s1.idle || 0,
    forummod3Sig: s2.open || 0,
    badgeearn3Sig: s3.draft || 0,
    volunteer3Sig: s4.planned || 0,
    chapter3Sig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Chaos Drill ${s0.planned || 0} · Circle ${s1.idle || 0}`,
      `Forum Mod ${s2.open || 0} · Badge Earn ${s3.draft || 0}`,
      `Volunteer ${s4.planned || 0} · Chapter ${s5.idle || 0}`,
    ],
  };
}
