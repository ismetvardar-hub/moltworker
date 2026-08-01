/**
 * AŞAMA 1050 — Phoenix2 checkpoint.
 */
import { buildCharter2 } from './charter2.js';
import { createBoardresolve2, listBoardresolve2, boardresolve2Summary, updateBoardresolve2 } from './boardresolve2.js';
import { createBackupjob2, listBackupjob2, backupjob2Summary, updateBackupjob2 } from './backupjob2.js';
import { createRunbook2, listRunbook2, runbook2Summary, updateRunbook2 } from './runbook2.js';
import { createCommsbridge22, listCommsbridge22, commsbridge22Summary, updateCommsbridge22 } from './commsbridge22.js';
import { createColdsite2, listColdsite2, coldsite2Summary, updateColdsite2 } from './coldsite2.js';
import { createDrillscore2, listDrillscore2, drillscore2Summary, updateDrillscore2 } from './drillscore2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildPhoenix2() {
  const prev = buildCharter2();
  const s0 = boardresolve2Summary();
  const s1 = backupjob2Summary();
  const s2 = runbook2Summary();
  const s3 = commsbridge22Summary();
  const s4 = coldsite2Summary();
  const s5 = drillscore2Summary();
  const flags = readCollection('phoenix2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Phoenix2',
    charter2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    boardresolve2Sig: s0.idle || 0,
    backupjob2Sig: s1.open || 0,
    runbook2Sig: s2.draft || 0,
    commsbridge22Sig: s3.planned || 0,
    coldsite2Sig: s4.idle || 0,
    drillscore2Sig: s5.open || 0,
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
      `Phoenix2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runPhoenix2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildPhoenix2();
  const existing = readCollection('phoenix2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.backupjob2Sig || 0) > 0)) {
    candidates.push({ key: 'backup', level: 'alert', text: `Backup open ${o.backupjob2Sig || 0}`, domain: 'backup' });
  }
  if (force || ((o.drillscore2Sig || 0) > 0)) {
    candidates.push({ key: 'drill', level: 'warn', text: `Drill open ${o.drillscore2Sig || 0}`, domain: 'drill' });
  }
  if (force || ((o.runbook2Sig || 0) > 0 || (o.coldsite2Sig || 0) > 0)) {
    candidates.push({ key: 'dr', level: 'info', text: `Runbook ${o.runbook2Sig || 0} · Cold site ${o.coldsite2Sig || 0}`, domain: 'dr' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Phoenix2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('pxf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('phoenix2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `phoenix2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('pxs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('phoenix2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'phoenix2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildPhoenix2() };
}

export function ackPhoenix2Flag(input = {}, actor = 'system') {
  const list = readCollection('phoenix2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('phoenix2-flags', list);
  appendAudit({ actor, action: 'phoenix2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildPhoenix2() };
}

export function closePhoenix2Backup(input = {}, actor = 'system') {
  const rows = listBackupjob2().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBackupjob2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createBackupjob2({ system: 'core', size: '1GB', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'phoenix2.backup_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPhoenix2() };
}

export function livePhoenix2Runbook(input = {}, actor = 'system') {
  const rows = listRunbook2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRunbook2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createRunbook2({ title: 'phoenix', owner: 'ops', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const c of listCommsbridge22().filter((x) => x.status === 'planned').slice(0, 5)) { updateCommsbridge22(c.id, { status: 'doing', touched_by: actor }, actor); }
  for (const b of listBoardresolve2().filter((x) => x.status === 'idle').slice(0, 5)) { updateBoardresolve2(b.id, { status: 'busy', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'phoenix2.runbook_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildPhoenix2() };
}

export function closePhoenix2Drill(input = {}, actor = 'system') {
  const rows = listDrillscore2().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDrillscore2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createDrillscore2({ drill: 'P2', score: 90, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const c of listColdsite2().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) { updateColdsite2(c.id, { status: 'busy', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'NEXUS', title: `phoenix2 drill_close · ${closed.length}`, priority: 'high', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'phoenix2.drill_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPhoenix2() };
}
