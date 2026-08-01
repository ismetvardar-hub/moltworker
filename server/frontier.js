/**
 * AŞAMA 855 — Frontier checkpoint.
 */
import { buildPhoenix } from './phoenix.js';
import { restorejobSummary } from './restorejob.js';
import { sitehuntSummary } from './sitehunt.js';
import { softopenSummary } from './softopen.js';
import { localhireSummary } from './localhire.js';
import { landleaseSummary } from './landlease.js';
import { ffespecSummary } from './ffespec.js';

export function buildFrontier() {
  const prev = buildPhoenix();
  const s0 = restorejobSummary();
  const s1 = sitehuntSummary();
  const s2 = softopenSummary();
  const s3 = localhireSummary();
  const s4 = landleaseSummary();
  const s5 = ffespecSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Frontier",
    phoenix: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    restorejobSig: s0.planned || 0,
    sitehuntSig: s1.idle || 0,
    softopenSig: s2.open || 0,
    localhireSig: s3.draft || 0,
    landleaseSig: s4.planned || 0,
    ffespecSig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Restore Job ${s0.planned || 0} · Site Hunt ${s1.idle || 0}`,
      `Soft Open ${s2.open || 0} · Local Hire ${s3.draft || 0}`,
      `Land Lease ${s4.planned || 0} · FFE Spec ${s5.idle || 0}`,
    ],
  };
}
