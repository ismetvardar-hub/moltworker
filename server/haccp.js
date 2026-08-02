/**
 * Wave 171 - HACCP probe and corrective ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('haccp', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'hcp_1',
      checkpoint: 'Soguk oda',
      reading: '4C',
      tempC: 4,
      status: 'pass',
      at: new Date().toISOString(),
    }];
    writeCollection('haccp', seed);
    return seed;
  }
  return list;
}

function openHaccpFlags() {
  const flags = readCollection('haccp-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addHaccpFlag(candidate, actor = 'system') {
  const existing = readCollection('haccp-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('hcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('haccp-flags', list.slice(0, 200));
  return flag;
}

function isTempBreach(row) {
  if (row.status === 'fail' || row.tempBreach === true) return true;
  const temp = Number(row.tempC ?? row.temperatureC);
  const max = Number(row.maxTempC ?? 5);
  return Number.isFinite(temp) && temp > max;
}

export function listHaccp(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createHaccp(input = {}, actor = 'system') {
  const row = {
    id: rid('hcp'),
    checkpoint: input.checkpoint !== undefined ? input.checkpoint : 'Soguk oda',
    reading: input.reading !== undefined ? input.reading : '4C',
    tempC: input.tempC !== undefined ? Number(input.tempC) || 0 : undefined,
    maxTempC: input.maxTempC !== undefined ? Number(input.maxTempC) || 0 : 5,
    status: input.status || 'pass',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('haccp', row, 300);
  appendAudit({
    actor,
    action: 'haccp.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateHaccp(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.tempC !== undefined) next.tempC = Number(next.tempC) || 0;
  if (next.maxTempC !== undefined) next.maxTempC = Number(next.maxTempC) || 0;
  list[idx] = next;
  writeCollection('haccp', list);
  appendAudit({ actor, action: 'haccp.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function haccpSummary() {
  const list = listHaccp();
  const tempBreaches = list.filter(isTempBreach);
  const correctiveLogs = list.filter((x) => x.correctiveLogged === true || x.correctiveAt);
  const probeChecks = list.filter((x) => x.probeCheck === true || x.checkType === 'probe');
  const flags = openHaccpFlags();
  return {
    title: 'LIKYA HACCP Ops',
    total: list.length,
    pass: list.filter((x) => x.status === 'pass').length,
    fail: list.filter((x) => x.status === 'fail').length,
    pending: list.filter((x) => x.status === 'pending').length,
    tempBreaches: tempBreaches.length,
    correctiveLogs: correctiveLogs.length,
    probeChecks: probeChecks.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      pass: list.filter((x) => x.status === 'pass').length,
      fail: list.filter((x) => x.status === 'fail').length,
      pending: list.filter((x) => x.status === 'pending').length,
      temp_breaches: tempBreaches.length,
      corrective_logs: correctiveLogs.length,
      probe_checks: probeChecks.length,
    },
    summaryLines: [
      `HACCP ${list.length} check - temp breach ${tempBreaches.length} - pending ${list.filter((x) => x.status === 'pending').length}`,
      `Corrective logs ${correctiveLogs.length} - probe checks ${probeChecks.length} - flag ${flags.length}`,
    ],
    haccp: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runHaccpSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = haccpSummary();
  const created = [];
  const candidates = [];
  if (force || overview.tempBreaches > 0) {
    candidates.push({
      key: 'haccp_temp_breach',
      level: overview.tempBreaches > 0 ? 'alert' : 'info',
      text: `HACCP temp breaches ${overview.tempBreaches}`,
      domain: 'temperature',
    });
  }
  if (force || overview.correctiveLogs > 0) {
    candidates.push({
      key: 'haccp_corrective_log',
      level: 'info',
      text: `HACCP corrective logs ${overview.correctiveLogs}`,
      domain: 'corrective',
    });
  }
  if (force || overview.probeChecks > 0) {
    candidates.push({
      key: 'haccp_probe_check',
      level: 'info',
      text: `HACCP probe checks ${overview.probeChecks}`,
      domain: 'probe',
    });
  }
  for (const candidate of candidates) {
    const flag = addHaccpFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `haccp sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('hcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('haccp-sweeps', sweep, 80);
  appendAudit({ actor, action: 'haccp.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: haccpSummary() };
}

export function ackHaccpFlag(input = {}, actor = 'system') {
  const list = readCollection('haccp-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('haccp-flags', list);
  appendAudit({ actor, action: 'haccp.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: haccpSummary() };
}

export function markHaccpTempBreach(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.checkpoint && x.checkpoint === input.checkpoint));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'fail');
  if (idx < 0) return { ok: false, error: 'Temp breach yapilacak HACCP yok' };
  const tempC = Number(input.tempC ?? 9) || 9;
  list[idx] = {
    ...list[idx],
    status: 'fail',
    tempBreach: true,
    tempC,
    maxTempC: Number(input.maxTempC ?? list[idx].maxTempC ?? 5) || 5,
    reading: input.reading || `${tempC}C`,
    breachAt: input.breachAt || new Date().toISOString(),
    breachBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('haccp', list);
  appendAudit({ actor, action: 'haccp.temp_breach', detail: list[idx].checkpoint || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, haccp: list[idx], overview: haccpSummary() };
}

export function logHaccpCorrective(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.checkpoint && x.checkpoint === input.checkpoint));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isTempBreach);
  if (idx < 0) return { ok: false, error: 'Corrective log edilecek HACCP yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'pass',
    tempBreach: false,
    correctiveLogged: true,
    correctiveAction: input.correctiveAction || input.action || 'Discarded product and recalibrated probe',
    correctiveAt: input.correctiveAt || new Date().toISOString(),
    correctiveBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('haccp', list);
  appendAudit({ actor, action: 'haccp.corrective_log', detail: list[idx].checkpoint || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, haccp: list[idx], overview: haccpSummary() };
}

export function seedProbeCheck(input = {}, actor = 'system') {
  const haccp = createHaccp(
    {
      checkpoint: input.checkpoint || 'Probe check',
      reading: input.reading || '3C',
      tempC: Number(input.tempC ?? 3) || 3,
      maxTempC: Number(input.maxTempC ?? 5) || 5,
      status: input.status || 'pending',
    },
    actor,
  );
  const patched = updateHaccp(
    haccp.id,
    {
      probeCheck: true,
      checkType: 'probe',
      probeId: input.probeId || input.probe || 'probe-main',
    },
    actor,
  );
  appendAudit({ actor, action: 'haccp.seed_probe_check', detail: patched?.probeId || haccp.checkpoint, meta: { id: haccp.id } });
  return { ok: true, haccp: patched || haccp, overview: haccpSummary() };
}
