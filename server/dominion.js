/**
 * AŞAMA 750 — Dominion checkpoint.
 */
import { buildArtery } from './artery.js';
import { createSupplierkpi, listSupplierkpi, supplierkpiSummary, updateSupplierkpi } from './supplierkpi.js';
import { createBoardpulse, listBoardpulse, boardpulseSummary, updateBoardpulse } from './boardpulse.js';
import { createCashpulse, listCashpulse, cashpulseSummary, updateCashpulse } from './cashpulse.js';
import { createGuestheat, listGuestheat, guestheatSummary, updateGuestheat } from './guestheat.js';
import { createAgentpulse, listAgentpulse, agentpulseSummary, updateAgentpulse } from './agentpulse.js';
import { createAlertfuse, listAlertfuse, alertfuseSummary, updateAlertfuse } from './alertfuse.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildDominion() {
  const prev = buildArtery();
  const s0 = supplierkpiSummary();
  const s1 = boardpulseSummary();
  const s2 = cashpulseSummary();
  const s3 = guestheatSummary();
  const s4 = agentpulseSummary();
  const s5 = alertfuseSummary();
  const flags = readCollection('dominion-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Dominion',
    artery: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    supplierkpiSig: s0.draft || 0,
    boardpulseSig: s1.planned || 0,
    cashpulseSig: s2.idle || 0,
    guestheatSig: s3.open || 0,
    agentpulseSig: s4.draft || 0,
    alertfuseSig: s5.planned || 0,
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
      `Dominion flag ${openFlags.length} açık`,
    ],
  };
}

export function runDominionSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildDominion();
  const existing = readCollection('dominion-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.supplierkpiSig || 0) > 0 || (o.agentpulseSig || 0) > 0)) {
    candidates.push({ key: 'supplier', level: 'alert', text: `Supplier draft ${o.supplierkpiSig || 0} · Agent ${o.agentpulseSig || 0}`, domain: 'supplier' });
  }
  if (force || ((o.boardpulseSig || 0) > 0 || (o.alertfuseSig || 0) > 0)) {
    candidates.push({ key: 'board', level: 'warn', text: `Board planned ${o.boardpulseSig || 0} · Alert ${o.alertfuseSig || 0}`, domain: 'board' });
  }
  if (force || ((o.cashpulseSig || 0) > 0 || (o.guestheatSig || 0) > 0)) {
    candidates.push({ key: 'cash', level: 'info', text: `Cash idle ${o.cashpulseSig || 0} · Guest heat ${o.guestheatSig || 0}`, domain: 'cash' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Dominion heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('domf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('dominion-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `dominion sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('doms'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('dominion-sweeps', sweep, 80);
  appendAudit({ actor, action: 'dominion.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildDominion() };
}

export function ackDominionFlag(input = {}, actor = 'system') {
  const list = readCollection('dominion-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('dominion-flags', list);
  appendAudit({ actor, action: 'dominion.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildDominion() };
}

export function liveDominionSupplier(input = {}, actor = 'system') {
  const rows = listSupplierkpi().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSupplierkpi(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSupplierkpi({ vendor: 'dominion', score: 5, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const a of listAgentpulse().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateAgentpulse(a.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'dominion.supplier_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildDominion() };
}

export function runDominionBoard(input = {}, actor = 'system') {
  const rows = listBoardpulse().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBoardpulse(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createBoardpulse({ topic: 'dominion', score: 5, status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const a of listAlertfuse().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateAlertfuse(a.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'dominion.board_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildDominion() };
}

export function busyDominionCash(input = {}, actor = 'system') {
  const rows = listCashpulse().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCashpulse(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createCashpulse({ bucket: 'dominion', amount: 5, status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const g of listGuestheat().filter((x) => x.status === 'open').slice(0, 5)) {
    updateGuestheat(g.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `dominion cash_busy · ${busied.length}`, priority: 'normal', payload: { ids: busied } }, actor);
  appendAudit({ actor, action: 'dominion.cash_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildDominion() };
}
