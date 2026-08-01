/**
 * AŞAMA 615 — Linen checkpoint.
 */
import { buildConvoy } from './convoy.js';
import { hkboardSummary } from './hkboard.js';
import { linenroomSummary } from './linenroom.js';
import { outoforderSummary } from './outoforder.js';
import { guestrequestSummary } from './guestrequest.js';
import { inspectroomSummary } from './inspectroom.js';
import { deepcleanSummary } from './deepclean.js';

export function buildLinen() {
  const prev = buildConvoy();
  const hk = hkboardSummary();
  const linen = linenroomSummary();
  const ooo = outoforderSummary();
  const req = guestrequestSummary();
  const insp = inspectroomSummary();
  const deep = deepcleanSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Linen",
    convoy: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    hkQueued: hk.queued || 0,
    linenLow: linen.low || 0,
    oooRooms: ooo.ooo || 0,
    reqOpen: req.open || 0,
    inspFail: insp.fail || 0,
    deepDue: deep.due || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `HK queued ${hk.queued || 0} · Linen low ${linen.low || 0}`,
      `OOO rooms ${ooo.ooo || 0} · Guest requests open ${req.open || 0}`,
      `Inspect fail ${insp.fail || 0} · Deep clean due ${deep.due || 0}`,
    ],
  };
}
