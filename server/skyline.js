/**
 * AŞAMA 195 — Skyline checkpoint (signalhub + leisure/entertainment sinyalleri).
 */
import { buildSignalhub } from './signalhub.js';
import { yachtSummary } from './yacht.js';
import { jetskiSummary } from './jetski.js';
import { helipadSummary } from './helipad.js';
import { djboothSummary } from './djbooth.js';
import { escaperoomSummary } from './escaperoom.js';
import { soundcheckSummary } from './soundcheck.js';

export function buildSkyline() {
  const hub = buildSignalhub();
  const yacht = yachtSummary();
  const jet = jetskiSummary();
  const heli = helipadSummary();
  const dj = djboothSummary();
  const escape = escaperoomSummary();
  const sound = soundcheckSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Skyline',
    signalhub: { summaryLines: (hub.summaryLines || []).slice(0, 2) },
    yachtChartered: yacht.chartered || 0,
    jetskiRented: jet.rented || 0,
    helipadBooked: heli.booked || 0,
    djLive: dj.live || 0,
    escapeRunning: escape.running || 0,
    soundFail: sound.fail || 0,
    summaryLines: [
      ...(hub.summaryLines || []).slice(0, 2),
      `Yat charter ${yacht.chartered || 0} · Jet ski kirada ${jet.rented || 0}`,
      `Helipad dolu ${heli.booked || 0} · DJ live ${dj.live || 0}`,
      `Escape running ${escape.running || 0} · Sound fail ${sound.fail || 0}`,
    ],
  };
}
