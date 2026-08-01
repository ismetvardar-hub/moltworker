/**
 * AŞAMA 1005 — Agora2 checkpoint.
 */
import { buildCircuit2 } from './circuit2.js';
import { chaosdrill2Summary } from './chaosdrill2.js';
import { circle2Summary } from './circle2.js';
import { forummod2Summary } from './forummod2.js';
import { badgeearn2Summary } from './badgeearn2.js';
import { volunteer2Summary } from './volunteer2.js';
import { chapter2Summary } from './chapter2.js';

export function buildAgora2() {
  const prev = buildCircuit2();
  const s0 = chaosdrill2Summary();
  const s1 = circle2Summary();
  const s2 = forummod2Summary();
  const s3 = badgeearn2Summary();
  const s4 = volunteer2Summary();
  const s5 = chapter2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Agora2",
    circuit2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    chaosdrill2Sig: s0.planned || 0,
    circle2Sig: s1.idle || 0,
    forummod2Sig: s2.open || 0,
    badgeearn2Sig: s3.draft || 0,
    volunteer2Sig: s4.planned || 0,
    chapter2Sig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Chaos Drill ${s0.planned || 0} · Circle ${s1.idle || 0}`,
      `Forum Mod ${s2.open || 0} · Badge Earn ${s3.draft || 0}`,
      `Volunteer ${s4.planned || 0} · Chapter ${s5.idle || 0}`,
    ],
  };
}
