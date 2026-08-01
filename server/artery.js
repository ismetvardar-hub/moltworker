/**
 * AŞAMA 735 — Artery checkpoint.
 */
import { buildAlliance2 } from './alliance2.js';
import { inboundpoSummary } from './inboundpo.js';
import { asntrackSummary } from './asntrack.js';
import { crossdockSummary } from './crossdock.js';
import { slotbookSummary } from './slotbook.js';
import { freightbillSummary } from './freightbill.js';
import { exceptionlogSummary } from './exceptionlog.js';

export function buildArtery() {
  const prev = buildAlliance2();
  const s0 = inboundpoSummary();
  const s1 = asntrackSummary();
  const s2 = crossdockSummary();
  const s3 = slotbookSummary();
  const s4 = freightbillSummary();
  const s5 = exceptionlogSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Artery",
    alliance2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    inboundpoSig: s0.planned || 0,
    asntrackSig: s1.idle || 0,
    crossdockSig: s2.open || 0,
    slotbookSig: s3.draft || 0,
    freightbillSig: s4.planned || 0,
    exceptionlogSig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Inbound PO ${s0.planned || 0} · ASN Track ${s1.idle || 0}`,
      `Cross Dock ${s2.open || 0} · Slot Book ${s3.draft || 0}`,
      `Freight Bill ${s4.planned || 0} · Exception Log ${s5.idle || 0}`,
    ],
  };
}
