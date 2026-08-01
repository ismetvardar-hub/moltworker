/**
 * AŞAMA 840 — Phoenix checkpoint.
 */
import { buildCharter } from './charter.js';
import { boardresolveSummary } from './boardresolve.js';
import { backupjobSummary } from './backupjob.js';
import { runbookSummary } from './runbook.js';
import { commsbridge2Summary } from './commsbridge2.js';
import { coldsiteSummary } from './coldsite.js';
import { drillscoreSummary } from './drillscore.js';

export function buildPhoenix() {
  const prev = buildCharter();
  const s0 = boardresolveSummary();
  const s1 = backupjobSummary();
  const s2 = runbookSummary();
  const s3 = commsbridge2Summary();
  const s4 = coldsiteSummary();
  const s5 = drillscoreSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Phoenix",
    charter: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    boardresolveSig: s0.idle || 0,
    backupjobSig: s1.open || 0,
    runbookSig: s2.draft || 0,
    commsbridge2Sig: s3.planned || 0,
    coldsiteSig: s4.idle || 0,
    drillscoreSig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Board Resolve ${s0.idle || 0} · Backup Job ${s1.open || 0}`,
      `Runbook ${s2.draft || 0} · Comms Bridge+ ${s3.planned || 0}`,
      `Cold Site ${s4.idle || 0} · Drill Score ${s5.open || 0}`,
    ],
  };
}
