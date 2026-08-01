/**
 * AŞAMA 570 — Beacon checkpoint.
 */
import { buildCrown } from './crown.js';
import { campdeskSummary } from './campdesk.js';
import { socialqueueSummary } from './socialqueue.js';
import { pushdeskSummary } from './pushdesk.js';
import { mediabuySummary } from './mediabuy.js';
import { seopageSummary } from './seopage.js';
import { leadmagnetSummary } from './leadmagnet.js';

export function buildBeacon() {
  const prev = buildCrown();
  const camp = campdeskSummary();
  const soc = socialqueueSummary();
  const push = pushdeskSummary();
  const ad = mediabuySummary();
  const seo = seopageSummary();
  const lead = leadmagnetSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Beacon",
    crown: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    campLive: camp.live || 0,
    socFailed: soc.failed || 0,
    pushScheduled: push.scheduled || 0,
    adSpent: ad.spent || 0,
    seoIssue: seo.issue || 0,
    leadLive: lead.live || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Campaigns live ${camp.live || 0} · Social failed ${soc.failed || 0}`,
      `Push scheduled ${push.scheduled || 0} · Ad spend rows ${ad.spent || 0}`,
      `SEO issues ${seo.issue || 0} · Lead magnets live ${lead.live || 0}`,
    ],
  };
}
