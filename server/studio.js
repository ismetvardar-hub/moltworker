/**
 * AŞAMA 675 — Studio checkpoint.
 */
import { buildBazaar } from './bazaar.js';
import { mediawallSummary } from './mediawall.js';
import { livecastSummary } from './livecast.js';
import { ugcmodSummary } from './ugcmod.js';
import { sponsorpackSummary } from './sponsorpack.js';
import { boostdeskSummary } from './boostdesk.js';
import { briefdeskSummary } from './briefdesk.js';

export function buildStudio() {
  const prev = buildBazaar();
  const wall = mediawallSummary();
  const live = livecastSummary();
  const ugc = ugcmodSummary();
  const spon = sponsorpackSummary();
  const boost = boostdeskSummary();
  const brief = briefdeskSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Studio",
    bazaar: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    wallPlaying: wall.playing || 0,
    liveOn: live.live || 0,
    ugcQueued: ugc.queued || 0,
    sponLive: spon.live || 0,
    boostRunning: boost.running || 0,
    briefProd: brief.in_prod || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Media wall playing ${wall.playing || 0} · Live casts ${live.live || 0}`,
      `UGC queued ${ugc.queued || 0} · Sponsors live ${spon.live || 0}`,
      `Boost running ${boost.running || 0} · Briefs in prod ${brief.in_prod || 0}`,
    ],
  };
}
