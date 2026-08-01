/**
 * AŞAMA 630 — Atlas checkpoint.
 */
import { buildLinen } from './linen.js';
import { deskqueueSummary } from './deskqueue.js';
import { arrivalboardSummary } from './arrivalboard.js';
import { departureboardSummary } from './departureboard.js';
import { foliodeskSummary } from './foliodesk.js';
import { nightauditSummary } from './nightaudit.js';
import { conciergejobSummary } from './conciergejob.js';

export function buildAtlas() {
  const prev = buildLinen();
  const desk = deskqueueSummary();
  const arr = arrivalboardSummary();
  const dep = departureboardSummary();
  const folio = foliodeskSummary();
  const audit = nightauditSummary();
  const conc = conciergejobSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Atlas",
    linen: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    deskWaiting: desk.waiting || 0,
    arrExpected: arr.expected || 0,
    depDue: dep.due || 0,
    folioDisputed: folio.disputed || 0,
    auditPending: audit.pending || 0,
    concOpen: conc.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Desk waiting ${desk.waiting || 0} · Arrivals expected ${arr.expected || 0}`,
      `Departures due ${dep.due || 0} · Folio disputed ${folio.disputed || 0}`,
      `Night audit pending ${audit.pending || 0} · Concierge open ${conc.open || 0}`,
    ],
  };
}
