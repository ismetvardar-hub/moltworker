/**
 * AŞAMA 945 — Artery2 checkpoint.
 */
import { buildAlliance3 } from './alliance3.js';
import { inboundpo2Summary } from './inboundpo2.js';
import { asntrack2Summary } from './asntrack2.js';
import { crossdock2Summary } from './crossdock2.js';
import { slotbook2Summary } from './slotbook2.js';
import { freightbill2Summary } from './freightbill2.js';
import { exceptionlog2Summary } from './exceptionlog2.js';

export function buildArtery2() {
  const prev = buildAlliance3();
  const s0 = inboundpo2Summary();
  const s1 = asntrack2Summary();
  const s2 = crossdock2Summary();
  const s3 = slotbook2Summary();
  const s4 = freightbill2Summary();
  const s5 = exceptionlog2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Artery2",
    alliance3: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    inboundpo2Sig: s0.planned || 0,
    asntrack2Sig: s1.idle || 0,
    crossdock2Sig: s2.open || 0,
    slotbook2Sig: s3.draft || 0,
    freightbill2Sig: s4.planned || 0,
    exceptionlog2Sig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Inbound PO ${s0.planned || 0} · ASN Track ${s1.idle || 0}`,
      `Cross Dock ${s2.open || 0} · Slot Book ${s3.draft || 0}`,
      `Freight Bill ${s4.planned || 0} · Exception Log ${s5.idle || 0}`,
    ],
  };
}
