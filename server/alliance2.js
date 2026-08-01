/**
 * AŞAMA 720 — Alliance2 checkpoint.
 */
import { buildBastion } from './bastion.js';
import { createPartnerdesk, listPartnerdesk, partnerdeskSummary, updatePartnerdesk } from './partnerdesk.js';
import { createChannelkit, listChannelkit, channelkitSummary, updateChannelkit } from './channelkit.js';
import { createCoinvest, listCoinvest, coinvestSummary, updateCoinvest } from './coinvest.js';
import { createJointpromo, listJointpromo, jointpromoSummary, updateJointpromo } from './jointpromo.js';
import { createB2border, listB2border, b2borderSummary, updateB2border } from './b2border.js';
import { createDealroom, listDealroom, dealroomSummary, updateDealroom } from './dealroom.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildAlliance2() {
  const prev = buildBastion();
  const s0 = partnerdeskSummary();
  const s1 = channelkitSummary();
  const s2 = coinvestSummary();
  const s3 = jointpromoSummary();
  const s4 = b2borderSummary();
  const s5 = dealroomSummary();
  const flags = readCollection('alliance2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Alliance2',
    bastion: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    partnerdeskSig: s0.idle || 0,
    channelkitSig: s1.open || 0,
    coinvestSig: s2.draft || 0,
    jointpromoSig: s3.planned || 0,
    b2borderSig: s4.idle || 0,
    dealroomSig: s5.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      partner_idle: s0.idle || 0,
      channel_open: s1.open || 0,
      invest_draft: s2.draft || 0,
      deal_open: s5.open || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Partner Desk ${s0.idle || 0} · Channel Kit ${s1.open || 0}`,
      `Co Invest ${s2.draft || 0} · Joint Promo ${s3.planned || 0}`,
      `B2B Order ${s4.idle || 0} · Deal Room ${s5.open || 0}`,
      `Alliance2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runAlliance2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAlliance2();
  const existing = readCollection('alliance2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.channelkitSig || 0) > 0 || (o.dealroomSig || 0) > 0)) {
    candidates.push({ key: 'channel', level: 'alert', text: `Channel open ${o.channelkitSig || 0} · Deal ${o.dealroomSig || 0}`, domain: 'channel' });
  }
  if (force || ((o.partnerdeskSig || 0) > 0 || (o.b2borderSig || 0) > 0)) {
    candidates.push({ key: 'partner', level: 'warn', text: `Partner idle ${o.partnerdeskSig || 0} · B2B ${o.b2borderSig || 0}`, domain: 'partner' });
  }
  if (force || ((o.coinvestSig || 0) > 0 || (o.jointpromoSig || 0) > 0)) {
    candidates.push({ key: 'invest', level: 'info', text: `Coinvest draft ${o.coinvestSig || 0} · Promo ${o.jointpromoSig || 0}`, domain: 'invest' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Alliance2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('al2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('alliance2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `alliance2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('al2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('alliance2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'alliance2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAlliance2() };
}

export function ackAlliance2Flag(input = {}, actor = 'system') {
  const list = readCollection('alliance2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('alliance2-flags', list);
  appendAudit({ actor, action: 'alliance2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAlliance2() };
}

export function busyAlliance2Partner(input = {}, actor = 'system') {
  const rows = listPartnerdesk().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePartnerdesk(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createPartnerdesk({ partner: 'alliance2', tier: 'ops', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const b of listB2border().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateB2border(b.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'alliance2.partner_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildAlliance2() };
}

export function closeAlliance2Channel(input = {}, actor = 'system') {
  const rows = listChannelkit().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChannelkit(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createChannelkit({ partner: 'alliance2', kit: 'closed', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const d of listDealroom().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateDealroom(d.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'alliance2.channel_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildAlliance2() };
}

export function liveAlliance2Invest(input = {}, actor = 'system') {
  const rows = listCoinvest().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCoinvest(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCoinvest({ deal: 'alliance2', amount: '1', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const j of listJointpromo().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateJointpromo(j.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `alliance2 invest_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'alliance2.invest_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildAlliance2() };
}
