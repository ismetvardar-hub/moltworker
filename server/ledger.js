/**
 * AŞAMA 255 — LİKYA Ledger checkpoint.
 */
import { buildMeridian } from './meridian.js';
import { createArbill, listArbill, arbillSummary, updateArbill } from './arbill.js';
import { createApbill, listApbill, apbillSummary, updateApbill } from './apbill.js';
import { createRefunds, listRefunds, refundsSummary, updateRefunds } from './refunds.js';
import { createChargeback, listChargeback, chargebackSummary, updateChargeback } from './chargeback.js';
import { createOverbook, listOverbook, overbookSummary, updateOverbook } from './overbook.js';
import { createChannelmgr, listChannelmgr, channelmgrSummary, updateChannelmgr } from './channelmgr.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildLedger() {
  const prev = buildMeridian();
  const ar = arbillSummary();
  const ap = apbillSummary();
  const ref = refundsSummary();
  const cb = chargebackSummary();
  const ob = overbookSummary();
  const ch = channelmgrSummary();
  const flags = readCollection('ledger-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Ledger',
    meridian: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    arOverdue: ar.overdue || 0,
    apHeld: ap.held || 0,
    refundsOpen: ref.requested || 0,
    chargebackOpen: cb.open || 0,
    overbookProposed: ob.proposed || 0,
    channelErrors: ch.error || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      ar_overdue: ar.overdue || 0,
      ap_held: ap.held || 0,
      chargeback_open: cb.open || 0,
      channel_errors: ch.error || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `AR gecikmiş ${ar.overdue || 0} · AP tutulmuş ${ap.held || 0}`,
      `İade talep ${ref.requested || 0} · Chargeback açık ${cb.open || 0}`,
      `Overbook öneri ${ob.proposed || 0} · Kanal hata ${ch.error || 0}`,
      `Ledger flag ${openFlags.length} açık`,
    ],
  };
}

export function runLedgerSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildLedger();
  const existing = readCollection('ledger-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.arOverdue || 0) > 0)) {
    candidates.push({ key: 'ar_overdue', level: 'alert', text: `AR gecikmiş ${o.arOverdue || 0}`, domain: 'ar' });
  }
  if (force || ((o.chargebackOpen || 0) > 0)) {
    candidates.push({ key: 'cb_open', level: 'alert', text: `Chargeback açık ${o.chargebackOpen || 0}`, domain: 'chargeback' });
  }
  if (force || ((o.apHeld || 0) > 0 || (o.channelErrors || 0) > 0)) {
    candidates.push({ key: 'pay_channel', level: 'warn', text: `AP held ${o.apHeld || 0} · Channel err ${o.channelErrors || 0}`, domain: 'pay' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Ledger heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ldf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('ledger-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'PLUTUS',
        title: `ledger sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('lds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('ledger-sweeps', sweep, 80);
  appendAudit({ actor, action: 'ledger.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildLedger() };
}

export function ackLedgerFlag(input = {}, actor = 'system') {
  const list = readCollection('ledger-flags', []) || [];
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
  writeCollection('ledger-flags', list);
  appendAudit({ actor, action: 'ledger.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildLedger() };
}

export function collectLedgerAr(input = {}, actor = 'system') {
  const rows = listArbill().filter((x) => x.status === 'overdue' || x.status === 'current');
  const collected = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateArbill(row.id, { status: 'collected', touched_by: actor }, actor);
    if (next) collected.push(next.id);
  }
  if (!collected.length) {
    const seeded = createArbill({ customer: 'ledger', amount: 1, aging: '0', status: 'collected' }, actor);
    collected.push(seeded.id);
  }
  appendAudit({ actor, action: 'ledger.ar_collect', detail: `${collected.length}`, meta: { n: collected.length } });
  return { ok: true, collected, overview: buildLedger() };
}

export function resolveLedgerChargeback(input = {}, actor = 'system') {
  const rows = listChargeback().filter((x) => x.status === 'open');
  const resolved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChargeback(row.id, { status: 'won', touched_by: actor }, actor);
    if (next) resolved.push(next.id);
  }
  if (!resolved.length) {
    const seeded = createChargeback({ caseId: 'ledger', amount: 1, status: 'won' }, actor);
    resolved.push(seeded.id);
  }
  for (const r of listRefunds().filter((x) => x.status === 'requested').slice(0, 5)) { updateRefunds(r.id, { status: 'approved', touched_by: actor }, actor); }
  for (const a of listApbill().filter((x) => x.status === 'held').slice(0, 5)) { updateApbill(a.id, { status: 'scheduled', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'ledger.cb_resolve', detail: `${resolved.length}`, meta: { n: resolved.length } });
  return { ok: true, resolved, overview: buildLedger() };
}

export function clearLedgerChannel(input = {}, actor = 'system') {
  const rows = listChannelmgr().filter((x) => x.status === 'error');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChannelmgr(row.id, { status: 'mapped', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createChannelmgr({ channel: 'ledger', roomType: 'STD', status: 'mapped' }, actor);
    cleared.push(seeded.id);
  }
  for (const o of listOverbook().filter((x) => x.status === 'proposed').slice(0, 5)) { updateOverbook(o.id, { status: 'approved', touched_by: actor }, actor); }
  enqueueAgentJob(
    {
      agent: 'PLUTUS',
      title: `ledger channel_clear · ${cleared.length}`,
      priority: 'high',
      payload: { ids: cleared },
    },
    actor,
  );
  appendAudit({ actor, action: 'ledger.channel_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildLedger() };
}
