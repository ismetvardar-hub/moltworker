/**
 * AŞAMA 165 — Pyramid checkpoint (apex + platform/tech sinyalleri).
 */
import { buildApex } from './apex.js';
import { createExtlinks, listExtlinks, extlinksSummary, updateExtlinks } from './extlinks.js';
import { createSysalerts, listSysalerts, sysalertsSummary, updateSysalerts } from './sysalerts.js';
import { createBackupsched, listBackupsched, backupschedSummary, updateBackupsched } from './backupsched.js';
import { createMailqueue, listMailqueue, mailqueueSummary, updateMailqueue } from './mailqueue.js';
import { createSmsqueue, listSmsqueue, smsqueueSummary, updateSmsqueue } from './smsqueue.js';
import { createDnscheck, listDnscheck, dnscheckSummary, updateDnscheck } from './dnscheck.js';
import { createSecretsrot, listSecretsrot, secretsrotSummary, updateSecretsrot } from './secretsrot.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildPyramid() {
  const apex = buildApex();
  const ext = extlinksSummary();
  const alerts = sysalertsSummary();
  const bak = backupschedSummary();
  const mail = mailqueueSummary();
  const sms = smsqueueSummary();
  const dns = dnscheckSummary();
  const sec = secretsrotSummary();
  const flags = readCollection('pyramid-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
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
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      sys_open: alerts.open || 0,
      backup_failed: bak.failed || 0,
      dns_fail: dns.fail || 0,
      secrets_overdue: sec.overdue || 0,
    },
    summaryLines: [
      ...(apex.summaryLines || []).slice(0, 2),
      `Entegrasyon offline ${ext.offline || 0} / degraded ${ext.degraded || 0}`,
      `Sistem alarm açık ${alerts.open || 0} · Yedek fail ${bak.failed || 0}`,
      `Mail fail ${mail.failed || 0} · SMS fail ${sms.failed || 0}`,
      `DNS fail ${dns.fail || 0} · Secret overdue ${sec.overdue || 0}`,
      `Pyramid flag ${openFlags.length} açık`,
    ],
  };
}

export function runPyramidSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildPyramid();
  const existing = readCollection('pyramid-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.sysOpen || 0) > 0 || (o.backupFailed || 0) > 0)) {
    candidates.push({ key: 'sys', level: 'alert', text: `Sys open ${o.sysOpen || 0} · Backup fail ${o.backupFailed || 0}`, domain: 'sys' });
  }
  if (force || ((o.integrationsOffline || 0) > 0 || (o.dnsFail || 0) > 0)) {
    candidates.push({ key: 'net', level: 'warn', text: `Offline ${o.integrationsOffline || 0} · DNS ${o.dnsFail || 0}`, domain: 'net' });
  }
  if (force || ((o.mailFailed || 0) > 0 || (o.smsFailed || 0) > 0 || (o.secretsOverdue || 0) > 0)) {
    candidates.push({ key: 'comms', level: 'info', text: `Mail ${o.mailFailed || 0} · SMS ${o.smsFailed || 0} · Secrets ${o.secretsOverdue || 0}`, domain: 'comms' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Pyramid heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('pyf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('pyramid-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `pyramid sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('pys'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('pyramid-sweeps', sweep, 80);
  appendAudit({ actor, action: 'pyramid.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildPyramid() };
}

export function ackPyramidFlag(input = {}, actor = 'system') {
  const list = readCollection('pyramid-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('pyramid-flags', list);
  appendAudit({ actor, action: 'pyramid.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildPyramid() };
}

export function resolvePyramidSys(input = {}, actor = 'system') {
  const rows = listSysalerts().filter((x) => x.status === 'open' || x.status === 'acked');
  const resolved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSysalerts(row.id, { status: 'resolved', touched_by: actor }, actor);
    if (next) resolved.push(next.id);
  }
  if (!resolved.length) {
    const seeded = createSysalerts({ title: 'pyramid', level: 'info', status: 'resolved' }, actor);
    resolved.push(seeded.id);
  }
  for (const b of listBackupsched().filter((x) => x.status === 'failed' || x.status === 'paused').slice(0, 5)) {
    updateBackupsched(b.id, { status: 'enabled', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'pyramid.sys_resolve', detail: `${resolved.length}`, meta: { n: resolved.length } });
  return { ok: true, resolved, overview: buildPyramid() };
}

export function healPyramidNet(input = {}, actor = 'system') {
  const rows = listExtlinks().filter((x) => x.status === 'offline' || x.status === 'degraded');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateExtlinks(row.id, { status: 'online', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createExtlinks({ system: 'pyramid', endpoint: 'https://ok.local', status: 'online' }, actor);
    healed.push(seeded.id);
  }
  for (const d of listDnscheck().filter((x) => x.status === 'fail' || x.status === 'warn').slice(0, 5)) {
    updateDnscheck(d.id, { status: 'ok', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'pyramid.net_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildPyramid() };
}

export function flushPyramidComms(input = {}, actor = 'system') {
  const rows = listMailqueue().filter((x) => x.status === 'failed' || x.status === 'queued');
  const flushed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateMailqueue(row.id, { status: 'sent', touched_by: actor }, actor);
    if (next) flushed.push(next.id);
  }
  if (!flushed.length) {
    const seeded = createMailqueue({ to: 'ops@likya', subject: 'pyramid', status: 'sent' }, actor);
    flushed.push(seeded.id);
  }
  for (const s of listSmsqueue().filter((x) => x.status === 'failed' || x.status === 'queued').slice(0, 5)) {
    updateSmsqueue(s.id, { status: 'sent', touched_by: actor }, actor);
  }
  for (const sec of listSecretsrot().filter((x) => x.status === 'overdue' || x.status === 'scheduled').slice(0, 5)) {
    updateSecretsrot(sec.id, { status: 'done', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'NEXUS', title: `pyramid comms_flush · ${flushed.length}`, priority: 'normal', payload: { ids: flushed } }, actor);
  appendAudit({ actor, action: 'pyramid.comms_flush', detail: `${flushed.length}`, meta: { n: flushed.length } });
  return { ok: true, flushed, overview: buildPyramid() };
}
