/**
 * AŞAMA 1095 — Helios checkpoint.
 */
import { buildAether } from './aether.js';
import { inboundpo3Summary } from './inboundpo3.js';
import { asntrack3Summary } from './asntrack3.js';
import { crossdock3Summary } from './crossdock3.js';
import { slotbook3Summary } from './slotbook3.js';
import { freightbill3Summary } from './freightbill3.js';
import { exceptionlog3Summary } from './exceptionlog3.js';

export function buildHelios() {
  const prev = buildAether();
  const s0 = inboundpo3Summary();
  const s1 = asntrack3Summary();
  const s2 = crossdock3Summary();
  const s3 = slotbook3Summary();
  const s4 = freightbill3Summary();
  const s5 = exceptionlog3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Helios",
    aether: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    inboundpo3Sig: s0.planned || 0,
    asntrack3Sig: s1.idle || 0,
    crossdock3Sig: s2.open || 0,
    slotbook3Sig: s3.draft || 0,
    freightbill3Sig: s4.planned || 0,
    exceptionlog3Sig: s5.idle || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Inbound PO ${s0.planned || 0} · ASN Track ${s1.idle || 0}`,
      `Cross Dock ${s2.open || 0} · Slot Book ${s3.draft || 0}`,
      `Freight Bill ${s4.planned || 0} · Exception Log ${s5.idle || 0}`,
    ],
  };
}
