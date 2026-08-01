/**
 * AŞAMA 840 — Phoenix checkpoint.
 */
import { buildCharter } from './charter.js';
import { createBoardresolve, listBoardresolve, boardresolveSummary, updateBoardresolve } from './boardresolve.js';
import { createBackupjob, listBackupjob, backupjobSummary, updateBackupjob } from './backupjob.js';
import { createRunbook, listRunbook, runbookSummary, updateRunbook } from './runbook.js';
import { createCommsbridge2, listCommsbridge2, commsbridge2Summary, updateCommsbridge2 } from './commsbridge2.js';
import { createColdsite, listColdsite, coldsiteSummary, updateColdsite } from './coldsite.js';
import { createDrillscore, listDrillscore, drillscoreSummary, updateDrillscore } from './drillscore.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildPhoenix() {
  const prev = buildCharter();
  const s0 = boardresolveSummary();
  const s1 = backupjobSummary();
  const s2 = runbookSummary();
  const s3 = commsbridge2Summary();
  const s4 = coldsiteSummary();
  const s5 = drillscoreSummary();
  const flags = readCollection('phoenix-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Phoenix',
    charter: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    boardresolveSig: s0.idle || 0,
    backupjobSig: s1.open || 0,
    runbookSig: s2.draft || 0,
    commsbridge2Sig: s3.planned || 0,
    coldsiteSig: s4.idle || 0,
    drillscoreSig: s5.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      backup_open: s1.open || 0,
      runbook_draft: s2.draft || 0,
      drill_open: s5.open || 0,
      coldsite_idle: s4.idle || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Board Resolve ${s0.idle || 0} · Backup Job ${s1.open || 0}`,
      `Runbook ${s2.draft || 0} · Comms Bridge+ ${s3.planned || 0}`,
      `Cold Site ${s4.idle || 0} · Drill Score ${s5.open || 0}`,
      `Phoenix flag ${openFlags.length} açık`,
    ],
  };
}

export function runPhoenixSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildPhoenix();
  const existing = readCollection('phoenix-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.backupjobSig || 0) > 0)) {
    candidates.push({ key: 'backup', level: 'alert', text: `Backup open ${o.backupjobSig || 0}`, domain: 'backup' });
  }
  if (force || ((o.drillscoreSig || 0) > 0)) {
    candidates.push({ key: 'drill', level: 'warn', text: `Drill open ${o.drillscoreSig || 0}`, domain: 'drill' });
  }
  if (force || ((o.runbookSig || 0) > 0 || (o.coldsiteSig || 0) > 0)) {
    candidates.push({ key: 'dr', level: 'info', text: `Runbook ${o.runbookSig || 0} · Cold site ${o.coldsiteSig || 0}`, domain: 'dr' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Phoenix heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('phxf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('phoenix-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `phoenix sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('phxs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('phoenix-sweeps', sweep, 80);
  appendAudit({ actor, action: 'phoenix.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildPhoenix() };
}

export function ackPhoenixFlag(input = {}, actor = 'system') {
  const list = readCollection('phoenix-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('phoenix-flags', list);
  appendAudit({ actor, action: 'phoenix.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildPhoenix() };
}

export function closePhoenixBackup(input = {}, actor = 'system') {
  const rows = listBackupjob().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBackupjob(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createBackupjob({ system: 'phoenix', size: '1GB', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'phoenix.backup_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPhoenix() };
}

export function livePhoenixRunbook(input = {}, actor = 'system') {
  const rows = listRunbook().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRunbook(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createRunbook({ title: 'phoenix', owner: 'ops', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const c of listCommsbridge2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateCommsbridge2(c.id, { status: 'doing', touched_by: actor }, actor);
  }
  for (const b of listBoardresolve().filter((x) => x.status === 'idle').slice(0, 5)) {
    updateBoardresolve(b.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'phoenix.runbook_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildPhoenix() };
}

export function closePhoenixDrill(input = {}, actor = 'system') {
  const rows = listDrillscore().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDrillscore(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createDrillscore({ drill: 'phx', score: 90, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const c of listColdsite().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateColdsite(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'NEXUS', title: `phoenix drill_close · ${closed.length}`, priority: 'high', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'phoenix.drill_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPhoenix() };
}
