/**
 * AŞAMA 795 — Agora checkpoint.
 */
import { buildCircuit } from './circuit.js';
import { chaosdrillSummary } from './chaosdrill.js';
import { circleSummary } from './circle.js';
import { forummodSummary } from './forummod.js';
import { badgeearnSummary } from './badgeearn.js';
import { volunteerSummary } from './volunteer.js';
import { chapterSummary } from './chapter.js';

export function buildAgora() {
  const prev = buildCircuit();
  const s0 = chaosdrillSummary();
  const s1 = circleSummary();
  const s2 = forummodSummary();
  const s3 = badgeearnSummary();
  const s4 = volunteerSummary();
  const s5 = chapterSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Agora",
    circuit: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    chaosdrillSig: s0.planned || 0,
    circleSig: s1.idle || 0,
    forummodSig: s2.open || 0,
    badgeearnSig: s3.draft || 0,
    volunteerSig: s4.planned || 0,
    chapterSig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Chaos Drill ${s0.planned || 0} · Circle ${s1.idle || 0}`,
      `Forum Mod ${s2.open || 0} · Badge Earn ${s3.draft || 0}`,
      `Volunteer ${s4.planned || 0} · Chapter ${s5.idle || 0}`,
    ],
  };
}
