/**
 * AŞAMA 1200 — Apotheosis checkpoint.
 */
import { buildPathos } from './pathos.js';
import { createBoardresolve3, listBoardresolve3, boardresolve3Summary, updateBoardresolve3 } from './boardresolve3.js';
import { createBackupjob3, listBackupjob3, backupjob3Summary, updateBackupjob3 } from './backupjob3.js';
import { createRunbook3, listRunbook3, runbook3Summary, updateRunbook3 } from './runbook3.js';
import { createCommsbridge23, listCommsbridge23, commsbridge23Summary, updateCommsbridge23 } from './commsbridge23.js';
import { createColdsite3, listColdsite3, coldsite3Summary, updateColdsite3 } from './coldsite3.js';
import { createDrillscore3, listDrillscore3, drillscore3Summary, updateDrillscore3 } from './drillscore3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildApotheosis() {
  const prev = buildPathos();
  const s0 = boardresolve3Summary();
  const s1 = backupjob3Summary();
  const s2 = runbook3Summary();
  const s3 = commsbridge23Summary();
  const s4 = coldsite3Summary();
  const s5 = drillscore3Summary();
  const flags = readCollection('apotheosis-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Apotheosis',
    pathos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    boardresolve3Sig: s0.idle || 0,
    backupjob3Sig: s1.open || 0,
    runbook3Sig: s2.draft || 0,
    commsbridge23Sig: s3.planned || 0,
    coldsite3Sig: s4.idle || 0,
    drillscore3Sig: s5.open || 0,
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
      `Apotheosis flag ${openFlags.length} açık`,
    ],
  };
}

export function runApotheosisSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildApotheosis();
  const existing = readCollection('apotheosis-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.backupjob3Sig || 0) > 0)) {
    candidates.push({ key: 'backup', level: 'alert', text: `Backup open ${o.backupjob3Sig || 0}`, domain: 'backup' });
  }
  if (force || ((o.drillscore3Sig || 0) > 0)) {
    candidates.push({ key: 'drill', level: 'warn', text: `Drill open ${o.drillscore3Sig || 0}`, domain: 'drill' });
  }
  if (force || ((o.runbook3Sig || 0) > 0 || (o.coldsite3Sig || 0) > 0)) {
    candidates.push({ key: 'dr', level: 'info', text: `Runbook ${o.runbook3Sig || 0} · Cold site ${o.coldsite3Sig || 0}`, domain: 'dr' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Apotheosis heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('apof'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('apotheosis-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `apotheosis sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('apos'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('apotheosis-sweeps', sweep, 80);
  appendAudit({ actor, action: 'apotheosis.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildApotheosis() };
}

export function ackApotheosisFlag(input = {}, actor = 'system') {
  const list = readCollection('apotheosis-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('apotheosis-flags', list);
  appendAudit({ actor, action: 'apotheosis.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildApotheosis() };
}

export function closeApotheosisBackup(input = {}, actor = 'system') {
  const rows = listBackupjob3().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBackupjob3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createBackupjob3({ system: 'apotheosis', size: '1GB', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'apotheosis.backup_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildApotheosis() };
}

export function liveApotheosisRunbook(input = {}, actor = 'system') {
  const rows = listRunbook3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRunbook3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createRunbook3({ title: 'apotheosis', owner: 'ops', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const c of listCommsbridge23().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateCommsbridge23(c.id, { status: 'doing', touched_by: actor }, actor);
  }
  for (const b of listBoardresolve3().filter((x) => x.status === 'idle').slice(0, 5)) {
    updateBoardresolve3(b.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'apotheosis.runbook_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildApotheosis() };
}

export function closeApotheosisDrill(input = {}, actor = 'system') {
  const rows = listDrillscore3().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDrillscore3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createDrillscore3({ drill: 'apo', score: 90, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const c of listColdsite3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateColdsite3(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'NEXUS', title: `apotheosis drill_close · ${closed.length}`, priority: 'high', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'apotheosis.drill_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildApotheosis() };
}
