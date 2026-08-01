/**
 * AŞAMA 480 — Sanctum checkpoint.
 */
import { buildHearth } from './hearth.js';
import { spaflowSummary } from './spaflow.js';
import { thermalbaySummary } from './thermalbay.js';
import { cryochamberSummary } from './cryochamber.js';
import { massagebookSummary } from './massagebook.js';
import { yogamatSummary } from './yogamat.js';
import { biomarkerSummary } from './biomarker.js';

export function buildSanctum() {
  const prev = buildHearth();
  const spa = spaflowSummary();
  const thermal = thermalbaySummary();
  const cryo = cryochamberSummary();
  const msg = massagebookSummary();
  const yoga = yogamatSummary();
  const bio = biomarkerSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Sanctum",
    hearth: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    spaInCabin: spa.in_cabin || 0,
    thermalBusy: thermal.busy || 0,
    cryoRunning: cryo.running || 0,
    massageLive: msg.in_session || 0,
    yogaFull: yoga.full || 0,
    bioFlagged: bio.flagged || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Spa in cabin ${spa.in_cabin || 0} · Thermal busy ${thermal.busy || 0}`,
      `Cryo running ${cryo.running || 0} · Massage in session ${msg.in_session || 0}`,
      `Yoga full ${yoga.full || 0} · Biomarker flagged ${bio.flagged || 0}`,
    ],
  };
}
