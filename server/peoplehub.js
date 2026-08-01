/**
 * AŞAMA 270 — People Hub checkpoint (ledger + İK/kültür sinyalleri).
 */
import { buildLedger } from './ledger.js';
import { onboardingSummary } from './onboarding.js';
import { leaverequestSummary } from './leaverequest.js';
import { attendanceSummary } from './attendance.js';
import { certificationsSummary } from './certifications.js';
import { nearmissSummary } from './nearmiss.js';
import { whistleSummary } from './whistle.js';

export function buildPeoplehub() {
  const led = buildLedger();
  const onb = onboardingSummary();
  const leave = leaverequestSummary();
  const att = attendanceSummary();
  const cert = certificationsSummary();
  const near = nearmissSummary();
  const wh = whistleSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA People Hub',
    ledger: { summaryLines: (led.summaryLines || []).slice(0, 2) },
    onboardingOpen: (onb.started || 0) + (onb.in_progress || 0),
    leaveRequested: leave.requested || 0,
    absentToday: att.absent || 0,
    certExpiring: cert.expiring || 0,
    nearMissOpen: near.reported || 0,
    whistleOpen: wh.open || 0,
    summaryLines: [
      ...(led.summaryLines || []).slice(0, 2),
      `Onboarding açık ${(onb.started || 0) + (onb.in_progress || 0)} · İzin talep ${leave.requested || 0}`,
      `Yoklama absent ${att.absent || 0} · Sertifika bitiyor ${cert.expiring || 0}`,
      `Near miss ${near.reported || 0} · Etik bildirim açık ${wh.open || 0}`,
    ],
  };
}
