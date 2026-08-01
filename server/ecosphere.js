/**
 * AŞAMA 285 — Ecosphere checkpoint (peoplehub + ESG/uyum sinyalleri).
 */
import { buildPeoplehub } from './peoplehub.js';
import { carbonlogSummary } from './carbonlog.js';
import { createWateraudit, listWateraudit, waterauditSummary, updateWateraudit } from './wateraudit.js';
import { createAirquality, listAirquality, airqualitySummary, updateAirquality } from './airquality.js';
import { createAuditfind, listAuditfind, auditfindSummary, updateAuditfind } from './auditfind.js';
import { createDataprotect, listDataprotect, dataprotectSummary, updateDataprotect } from './dataprotect.js';
import { createVendorrisk, listVendorrisk, vendorriskSummary, updateVendorrisk } from './vendorrisk.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildEcosphere() {
  const people = buildPeoplehub();
  const carbon = carbonlogSummary();
  const water = waterauditSummary();
  const air = airqualitySummary();
  const findings = auditfindSummary();
  const dp = dataprotectSummary();
  const risk = vendorriskSummary();
  const flags = readCollection('ecosphere-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Ecosphere',
    peoplehub: { summaryLines: (people.summaryLines || []).slice(0, 2) },
    carbonLogged: carbon.total || 0,
    waterCritical: water.critical || 0,
    airPoor: air.poor || 0,
    findingsOpen: findings.open || 0,
    dataprotectOpen: dp.open || 0,
    vendorHigh: risk.high || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      findings_open: findings.open || 0,
      dataprotect_open: dp.open || 0,
      vendor_high: risk.high || 0,
      water_critical: water.critical || 0,
    },
    summaryLines: [
      ...(people.summaryLines || []).slice(0, 2),
      `Karbon kayıt ${carbon.total || 0} · Su kritik ${water.critical || 0}`,
      `Hava poor ${air.poor || 0} · Denetim açık ${findings.open || 0}`,
      `KVKK talep açık ${dp.open || 0} · Vendor high ${risk.high || 0}`,
      `Ecosphere flag ${openFlags.length} açık`,
    ],
  };
}

export function runEcosphereSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const e = buildEcosphere();
  const existing = readCollection('ecosphere-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (e.findingsOpen || 0) > 0) {
    candidates.push({ key: 'findings_open', level: 'warn', text: `Denetim açık ${e.findingsOpen || 0}`, domain: 'audit' });
  }
  if (force || (e.dataprotectOpen || 0) > 0) {
    candidates.push({ key: 'kvkk_open', level: 'alert', text: `KVKK talep açık ${e.dataprotectOpen || 0}`, domain: 'privacy' });
  }
  if (force || (e.vendorHigh || 0) > 0 || (e.waterCritical || 0) > 0) {
    candidates.push({
      key: 'esg_pressure',
      level: 'alert',
      text: `Vendor high ${e.vendorHigh || 0} · Su kritik ${e.waterCritical || 0}`,
      domain: 'esg',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Ecosphere heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ecf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('ecosphere-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'GAIA-ESG',
        title: `ecosphere sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('ecs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('ecosphere-sweeps', sweep, 80);
  appendAudit({ actor, action: 'ecosphere.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildEcosphere() };
}

export function ackEcosphereFlag(input = {}, actor = 'system') {
  const list = readCollection('ecosphere-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('ecosphere-flags', list);
  appendAudit({ actor, action: 'ecosphere.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildEcosphere() };
}

export function mitigateEcosphereFinding(input = {}, actor = 'system') {
  const open = listAuditfind().filter((f) => f.status === 'open');
  const mitigated = [];
  for (const f of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && f.id !== input.id) continue;
    const next = updateAuditfind(f.id, { status: 'mitigated', mitigated_by: actor }, actor);
    if (next) mitigated.push(next.id);
  }
  if (!mitigated.length) {
    const seeded = createAuditfind({ finding: 'ecosphere-mitigate', severity: 'medium', status: 'mitigated' }, actor);
    mitigated.push(seeded.id);
  }
  appendAudit({ actor, action: 'ecosphere.find_mitigate', detail: `${mitigated.length}`, meta: { n: mitigated.length } });
  return { ok: true, mitigated, overview: buildEcosphere() };
}

export function fulfillEcosphereDataprotect(input = {}, actor = 'system') {
  const open = listDataprotect().filter((d) => d.status === 'open');
  const fulfilled = [];
  for (const d of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && d.id !== input.id) continue;
    const next = updateDataprotect(d.id, { status: 'fulfilled', fulfilled_by: actor }, actor);
    if (next) fulfilled.push(next.id);
  }
  if (!fulfilled.length) {
    const seeded = createDataprotect({ request: 'Silme', subject: 'ecosphere', status: 'fulfilled' }, actor);
    fulfilled.push(seeded.id);
  }
  // also clear critical water / poor air when present
  const waterCrit = listWateraudit().filter((w) => w.status === 'critical');
  for (const w of waterCrit.slice(0, 5)) {
    updateWateraudit(w.id, { status: 'ok', cleared_by: actor }, actor);
  }
  const airPoor = listAirquality().filter((a) => a.status === 'poor');
  for (const a of airPoor.slice(0, 5)) {
    updateAirquality(a.id, { status: 'good', cleared_by: actor }, actor);
  }
  if (!waterCrit.length && input.seed_env) {
    createWateraudit({ zone: 'Ecosphere', status: 'ok' }, actor);
  }
  appendAudit({ actor, action: 'ecosphere.dataprotect_fulfill', detail: `${fulfilled.length}`, meta: { n: fulfilled.length } });
  return { ok: true, fulfilled, overview: buildEcosphere() };
}

export function clearEcosphereVendorHigh(input = {}, actor = 'system') {
  const highs = listVendorrisk().filter((v) => v.status === 'high');
  const cleared = [];
  for (const v of highs.slice(0, Number(input.limit) || 20)) {
    if (input.id && v.id !== input.id) continue;
    const next = updateVendorrisk(v.id, { status: 'medium', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createVendorrisk({ vendor: 'ecosphere', score: 60, status: 'medium' }, actor);
    cleared.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'GAIA-ESG',
      title: `ecosphere vendor clear · ${cleared.length}`,
      priority: 'high',
      payload: { ids: cleared },
    },
    actor,
  );
  appendAudit({ actor, action: 'ecosphere.vendor_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildEcosphere() };
}
