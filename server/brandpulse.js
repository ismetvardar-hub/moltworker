/**
 * AŞAMA 300 — Brand Pulse checkpoint (ecosphere + marka/içerik sinyalleri).
 */
import { buildEcosphere } from './ecosphere.js';
import { socialinboxSummary } from './socialinbox.js';
import { ugcmodSummary } from './ugcmod.js';
import { adspendSummary } from './adspend.js';
import { brandguardSummary } from './brandguard.js';
import { creativereqSummary } from './creativereq.js';
import { livestreamSummary } from './livestream.js';

export function buildBrandpulse() {
  const eco = buildEcosphere();
  const inbox = socialinboxSummary();
  const ugc = ugcmodSummary();
  const ads = adspendSummary();
  const guard = brandguardSummary();
  const creative = creativereqSummary();
  const live = livestreamSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Brand Pulse',
    ecosphere: { summaryLines: (eco.summaryLines || []).slice(0, 2) },
    inboxNew: inbox.new || 0,
    ugcQueued: ugc.queued || 0,
    adsLive: ads.live || 0,
    brandWatching: guard.watching || 0,
    creativeQueued: creative.queued || 0,
    livestreamLive: live.live || 0,
    summaryLines: [
      ...(eco.summaryLines || []).slice(0, 2),
      `Sosyal inbox yeni ${inbox.new || 0} · UGC kuyruk ${ugc.queued || 0}`,
      `Reklam live ${ads.live || 0} · Marka izleme ${guard.watching || 0}`,
      `Kreatif kuyruk ${creative.queued || 0} · Livestream live ${live.live || 0}`,
    ],
  };
}
