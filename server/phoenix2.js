/**
 * AŞAMA 1050 — Phoenix2 checkpoint.
 */
import { buildCharter2 } from './charter2.js';
import { boardresolve2Summary } from './boardresolve2.js';
import { backupjob2Summary } from './backupjob2.js';
import { runbook2Summary } from './runbook2.js';
import { commsbridge22Summary } from './commsbridge22.js';
import { coldsite2Summary } from './coldsite2.js';
import { drillscore2Summary } from './drillscore2.js';

export function buildPhoenix2() {
  const prev = buildCharter2();
  const s0 = boardresolve2Summary();
  const s1 = backupjob2Summary();
  const s2 = runbook2Summary();
  const s3 = commsbridge22Summary();
  const s4 = coldsite2Summary();
  const s5 = drillscore2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Phoenix2",
    charter2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    boardresolve2Sig: s0.idle || 0,
    backupjob2Sig: s1.open || 0,
    runbook2Sig: s2.draft || 0,
    commsbridge22Sig: s3.planned || 0,
    coldsite2Sig: s4.idle || 0,
    drillscore2Sig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Board Resolve ${s0.idle || 0} · Backup Job ${s1.open || 0}`,
      `Runbook ${s2.draft || 0} · Comms Bridge+ ${s3.planned || 0}`,
      `Cold Site ${s4.idle || 0} · Drill Score ${s5.open || 0}`,
    ],
  };
}
