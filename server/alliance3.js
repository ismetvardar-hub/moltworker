/**
 * AŞAMA 930 — Alliance3 checkpoint.
 */
import { buildBastion2 } from './bastion2.js';
import { createPartnerdesk2, listPartnerdesk2, partnerdesk2Summary, updatePartnerdesk2 } from './partnerdesk2.js';
import { createChannelkit2, listChannelkit2, channelkit2Summary, updateChannelkit2 } from './channelkit2.js';
import { createCoinvest2, listCoinvest2, coinvest2Summary, updateCoinvest2 } from './coinvest2.js';
import { createJointpromo2, listJointpromo2, jointpromo2Summary, updateJointpromo2 } from './jointpromo2.js';
import { createB2border2, listB2border2, b2border2Summary, updateB2border2 } from './b2border2.js';
import { createDealroom2, listDealroom2, dealroom2Summary, updateDealroom2 } from './dealroom2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildAlliance3() {
  const prev = buildBastion2();
  const s0 = partnerdesk2Summary();
  const s1 = channelkit2Summary();
  const s2 = coinvest2Summary();
  const s3 = jointpromo2Summary();
  const s4 = b2border2Summary();
  const s5 = dealroom2Summary();
  const flags = readCollection('alliance3-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Alliance3',
    bastion2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    partnerdesk2Sig: s0.idle || 0,
    channelkit2Sig: s1.open || 0,
    coinvest2Sig: s2.draft || 0,
    jointpromo2Sig: s3.planned || 0,
    b2border2Sig: s4.idle || 0,
    dealroom2Sig: s5.open || 0,
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
      `Alliance3 flag ${openFlags.length} açık`,
    ],
  };
}

export function runAlliance3Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAlliance3();
  const existing = readCollection('alliance3-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.channelkit2Sig || 0) > 0 || (o.dealroom2Sig || 0) > 0)) {
    candidates.push({ key: 'channel', level: 'alert', text: `Channel open ${o.channelkit2Sig || 0} · Deal ${o.dealroom2Sig || 0}`, domain: 'channel' });
  }
  if (force || ((o.partnerdesk2Sig || 0) > 0 || (o.b2border2Sig || 0) > 0)) {
    candidates.push({ key: 'partner', level: 'warn', text: `Partner idle ${o.partnerdesk2Sig || 0} · B2B ${o.b2border2Sig || 0}`, domain: 'partner' });
  }
  if (force || ((o.coinvest2Sig || 0) > 0 || (o.jointpromo2Sig || 0) > 0)) {
    candidates.push({ key: 'invest', level: 'info', text: `Coinvest draft ${o.coinvest2Sig || 0} · Promo ${o.jointpromo2Sig || 0}`, domain: 'invest' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Alliance3 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('al3f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('alliance3-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `alliance3 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('al3s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('alliance3-sweeps', sweep, 80);
  appendAudit({ actor, action: 'alliance3.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAlliance3() };
}

export function ackAlliance3Flag(input = {}, actor = 'system') {
  const list = readCollection('alliance3-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('alliance3-flags', list);
  appendAudit({ actor, action: 'alliance3.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAlliance3() };
}

export function busyAlliance3Partner(input = {}, actor = 'system') {
  const rows = listPartnerdesk2().filter((x) => x.status === 'idle' || x.status === 'fault');
  const busied = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePartnerdesk2(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) busied.push(next.id);
  }
  if (!busied.length) {
    const seeded = createPartnerdesk2({ partner: 'alliance3', tier: 'ops', status: 'busy' }, actor);
    busied.push(seeded.id);
  }
  for (const b of listB2border2().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateB2border2(b.id, { status: 'busy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'alliance3.partner_busy', detail: `${busied.length}`, meta: { n: busied.length } });
  return { ok: true, busied, overview: buildAlliance3() };
}

export function closeAlliance3Channel(input = {}, actor = 'system') {
  const rows = listChannelkit2().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateChannelkit2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createChannelkit2({ partner: 'alliance3', kit: 'closed', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const d of listDealroom2().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateDealroom2(d.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'alliance3.channel_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildAlliance3() };
}

export function liveAlliance3Invest(input = {}, actor = 'system') {
  const rows = listCoinvest2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCoinvest2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCoinvest2({ deal: 'alliance3', amount: '1', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const j of listJointpromo2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateJointpromo2(j.id, { status: 'doing', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `alliance3 invest_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'alliance3.invest_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildAlliance3() };
}
