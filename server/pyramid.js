/**
 * AŞAMA 165 — Pyramid checkpoint (apex + platform/tech sinyalleri).
 */
import { buildApex } from './apex.js';
import { extlinksSummary } from './extlinks.js';
import { sysalertsSummary } from './sysalerts.js';
import { backupschedSummary } from './backupsched.js';
import { mailqueueSummary } from './mailqueue.js';
import { smsqueueSummary } from './smsqueue.js';
import { dnscheckSummary } from './dnscheck.js';
import { secretsrotSummary } from './secretsrot.js';

export function buildPyramid() {
  const apex = buildApex();
  const ext = extlinksSummary();
  const alerts = sysalertsSummary();
  const bak = backupschedSummary();
  const mail = mailqueueSummary();
  const sms = smsqueueSummary();
  const dns = dnscheckSummary();
  const sec = secretsrotSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Pyramid',
    apex: { summaryLines: (apex.summaryLines || []).slice(0, 2) },
    integrationsOffline: ext.offline || 0,
    integrationsDegraded: ext.degraded || 0,
    sysOpen: alerts.open || 0,
    backupFailed: bak.failed || 0,
    mailFailed: mail.failed || 0,
    smsFailed: sms.failed || 0,
    dnsFail: dns.fail || 0,
    secretsOverdue: sec.overdue || 0,
    summaryLines: [
      ...(apex.summaryLines || []).slice(0, 2),
      `Entegrasyon offline ${ext.offline || 0} / degraded ${ext.degraded || 0}`,
      `Sistem alarm açık ${alerts.open || 0} · Yedek fail ${bak.failed || 0}`,
      `Mail fail ${mail.failed || 0} · SMS fail ${sms.failed || 0}`,
      `DNS fail ${dns.fail || 0} · Secret overdue ${sec.overdue || 0}`,
    ],
  };
}
