/**
 * AŞAMA 1110 — Selene checkpoint.
 */
import { buildHelios } from './helios.js';
import { createSupplierkpi3, listSupplierkpi3, supplierkpi3Summary, updateSupplierkpi3 } from './supplierkpi3.js';
import { createBoardpulse3, listBoardpulse3, boardpulse3Summary, updateBoardpulse3 } from './boardpulse3.js';
import { createCashpulse3, listCashpulse3, cashpulse3Summary, updateCashpulse3 } from './cashpulse3.js';
import { createGuestheat3, listGuestheat3, guestheat3Summary, updateGuestheat3 } from './guestheat3.js';
import { createAgentpulse3, listAgentpulse3, agentpulse3Summary, updateAgentpulse3 } from './agentpulse3.js';
import { createAlertfuse3, listAlertfuse3, alertfuse3Summary, updateAlertfuse3 } from './alertfuse3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildSelene() {
  const prev = buildHelios();
  const s0 = supplierkpi3Summary();
  const s1 = boardpulse3Summary();
  const s2 = cashpulse3Summary();
  const s3 = guestheat3Summary();
  const s4 = agentpulse3Summary();
  const s5 = alertfuse3Summary();
  const flags = readCollection('selene-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Selene',
    helios: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    supplierkpi3Sig: s0.draft || 0,
    boardpulse3Sig: s1.planned || 0,
    cashpulse3Sig: s2.idle || 0,
    guestheat3Sig: s3.open || 0,
    agentpulse3Sig: s4.draft || 0,
    alertfuse3Sig: s5.planned || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      heat_open: s3.open || 0,
      supplier_draft: s0.draft || 0,
      board_planned: s1.planned || 0,
      cash_idle: s2.idle || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Supplier KPI ${s0.draft || 0} · Board Pulse ${s1.planned || 0}`,
      `Cash Pulse ${s2.idle || 0} · Guest Heat ${s3.open || 0}`,
      `Agent Pulse ${s4.draft || 0} · Alert Fuse ${s5.planned || 0}`,
      `Selene flag ${openFlags.length} açık`,
    ],
  };
}

export function runSeleneSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSelene();
  const existing = readCollection('selene-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.guestheat3Sig || 0) > 0)) {
    candidates.push({ key: 'heat', level: 'alert', text: `Guest heat open ${o.guestheat3Sig || 0}`, domain: 'heat' });
  }
  if (force || ((o.supplierkpi3Sig || 0) > 0 || (o.agentpulse3Sig || 0) > 0)) {
    candidates.push({ key: 'supplier', level: 'warn', text: `Supplier draft ${o.supplierkpi3Sig || 0} · Agent ${o.agentpulse3Sig || 0}`, domain: 'supplier' });
  }
  if (force || ((o.boardpulse3Sig || 0) > 0 || (o.cashpulse3Sig || 0) > 0 || (o.alertfuse3Sig || 0) > 0)) {
    candidates.push({ key: 'board', level: 'info', text: `Board planned ${o.boardpulse3Sig || 0} · Cash idle ${o.cashpulse3Sig || 0}`, domain: 'board' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Selene heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('self'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('selene-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `selene sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('sels'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('selene-sweeps', sweep, 80);
  appendAudit({ actor, action: 'selene.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSelene() };
}

export function ackSeleneFlag(input = {}, actor = 'system') {
  const list = readCollection('selene-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('selene-flags', list);
  appendAudit({ actor, action: 'selene.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSelene() };
}

export function closeSeleneHeat(input = {}, actor = 'system') {
  const rows = listGuestheat3().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateGuestheat3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createGuestheat3({ segment: 'selene', score: '1', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'selene.heat_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildSelene() };
}

export function liveSeleneSupplier(input = {}, actor = 'system') {
  const rows = listSupplierkpi3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSupplierkpi3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createSupplierkpi3({ vendor: 'selene', score: '1', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const a of listAgentpulse3().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateAgentpulse3(a.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'selene.supplier_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildSelene() };
}

export function runSeleneBoard(input = {}, actor = 'system') {
  const rows = listBoardpulse3().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBoardpulse3(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createBoardpulse3({ topic: 'selene', score: '1', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const a of listAlertfuse3().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateAlertfuse3(a.id, { status: 'doing', touched_by: actor }, actor);
  }
  for (const c of listCashpulse3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateCashpulse3(c.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `selene board_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'selene.board_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildSelene() };
}
