/**
 * AŞAMA 960 — Dominion2 checkpoint.
 */
import { buildArtery2 } from './artery2.js';
import { createSupplierkpi2, listSupplierkpi2, supplierkpi2Summary, updateSupplierkpi2 } from './supplierkpi2.js';
import { createBoardpulse2, listBoardpulse2, boardpulse2Summary, updateBoardpulse2 } from './boardpulse2.js';
import { createCashpulse2, listCashpulse2, cashpulse2Summary, updateCashpulse2 } from './cashpulse2.js';
import { createGuestheat2, listGuestheat2, guestheat2Summary, updateGuestheat2 } from './guestheat2.js';
import { createAgentpulse2, listAgentpulse2, agentpulse2Summary, updateAgentpulse2 } from './agentpulse2.js';
import { createAlertfuse2, listAlertfuse2, alertfuse2Summary, updateAlertfuse2 } from './alertfuse2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildDominion2() {
  const prev = buildArtery2();
  const s0 = supplierkpi2Summary();
  const s1 = boardpulse2Summary();
  const s2 = cashpulse2Summary();
  const s3 = guestheat2Summary();
  const s4 = agentpulse2Summary();
  const s5 = alertfuse2Summary();
  const flags = readCollection('dominion2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Dominion2',
    artery2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    supplierkpi2Sig: s0.draft || 0,
    boardpulse2Sig: s1.planned || 0,
    cashpulse2Sig: s2.idle || 0,
    guestheat2Sig: s3.open || 0,
    agentpulse2Sig: s4.draft || 0,
    alertfuse2Sig: s5.planned || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      supplier_draft: s0.draft || 0,
      board_planned: s1.planned || 0,
      cash_idle: s2.idle || 0,
      guest_open: s3.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Supplier KPI ${s0.draft || 0} · Board Pulse ${s1.planned || 0}`,
      `Cash Pulse ${s2.idle || 0} · Guest Heat ${s3.open || 0}`,
      `Agent Pulse ${s4.draft || 0} · Alert Fuse ${s5.planned || 0}`,
      `Dominion2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runDominion2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildDominion2();
  const existing = readCollection('dominion2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.supplierkpi2Sig || 0) > 0 || (o.agentpulse2Sig || 0) > 0)) {
    candidates.push({ key: 'supplier', level: 'alert', text: `Supplier draft ${o.supplierkpi2Sig || 0} · Agent ${o.agentpulse2Sig || 0}`, domain: 'supplier' });
  }
  if (force || ((o.boardpulse2Sig || 0) > 0 || (o.alertfuse2Sig || 0) > 0)) {
    candidates.push({ key: 'board', level: 'warn', text: `Board planned ${o.boardpulse2Sig || 0} · Alert ${o.alertfuse2Sig || 0}`, domain: 'board' });
  }
  if (force || ((o.cashpulse2Sig || 0) > 0 || (o.guestheat2Sig || 0) > 0)) {
    candidates.push({ key: 'cash', level: 'info', text: `Cash idle ${o.cashpulse2Sig || 0} · Guest heat ${o.guestheat2Sig || 0}`, domain: 'cash' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Dominion2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('dm2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('dominion2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `dominion2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('dm2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('dominion2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'dominion2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildDominion2() };
}

export function ackDominion2Flag(input = {}, actor = 'system') {
  const list = readCollection('dominion2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('dominion2-flags', list);
  appendAudit({ actor, action: 'dominion2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildDominion2() };
}

export function liveDominion2Supplier(input = {}, actor = 'system') {
  const rows = listSupplierkpi2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSupplierkpi2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSupplierkpi2({ vendor: 'dominion2', score: 5, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const a of listAgentpulse2().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateAgentpulse2(a.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'dominion2.supplier_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildDominion2() };
}

export function runDominion2Board(input = {}, actor = 'system') {
  const rows = listBoardpulse2().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBoardpulse2(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createBoardpulse2({ topic: 'dominion2', score: 5, status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const a of listAlertfuse2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateAlertfuse2(a.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'dominion2.board_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildDominion2() };
}

export function busyDominion2Cash(input = {}, actor = 'system') {
  const rows = listCashpulse2().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCashpulse2(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createCashpulse2({ bucket: 'dominion2', amount: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const g of listGuestheat2().filter((x) => x.status === 'open').slice(0, 5)) {
    updateGuestheat2(g.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `dominion2 cash_busy · ${busied.length}`, priority: 'normal', payload: { ids: busied } }, actor);
  appendAudit({ actor, action: 'dominion2.cash_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildDominion2() };
}
