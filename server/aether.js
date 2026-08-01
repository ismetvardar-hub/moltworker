/**
 * AŞAMA 1080 — Aether checkpoint.
 */
import { buildElysium } from './elysium.js';
import { createPartnerdesk3, listPartnerdesk3, partnerdesk3Summary, updatePartnerdesk3 } from './partnerdesk3.js';
import { createChannelkit3, listChannelkit3, channelkit3Summary, updateChannelkit3 } from './channelkit3.js';
import { createCoinvest3, listCoinvest3, coinvest3Summary, updateCoinvest3 } from './coinvest3.js';
import { createJointpromo3, listJointpromo3, jointpromo3Summary, updateJointpromo3 } from './jointpromo3.js';
import { createB2border3, listB2border3, b2border3Summary, updateB2border3 } from './b2border3.js';
import { createDealroom3, listDealroom3, dealroom3Summary, updateDealroom3 } from './dealroom3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildAether() {
  const prev = buildElysium();
  const s0 = partnerdesk3Summary();
  const s1 = channelkit3Summary();
  const s2 = coinvest3Summary();
  const s3 = jointpromo3Summary();
  const s4 = b2border3Summary();
  const s5 = dealroom3Summary();
  const flags = readCollection('aether-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Aether',
    elysium: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    partnerdesk3Sig: s0.idle || 0,
    channelkit3Sig: s1.open || 0,
    coinvest3Sig: s2.draft || 0,
    jointpromo3Sig: s3.planned || 0,
    b2border3Sig: s4.idle || 0,
    dealroom3Sig: s5.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      partner_idle: s0.idle || 0,
      channel_open: s1.open || 0,
      deal_open: s5.open || 0,
      coinvest_draft: s2.draft || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Partner Desk ${s0.idle || 0} · Channel Kit ${s1.open || 0}`,
      `Co Invest ${s2.draft || 0} · Joint Promo ${s3.planned || 0}`,
      `B2B Order ${s4.idle || 0} · Deal Room ${s5.open || 0}`,
      `Aether flag ${openFlags.length} açık`,
    ],
  };
}

export function runAetherSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAether();
  const existing = readCollection('aether-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.dealroom3Sig || 0) > 0)) {
    candidates.push({ key: 'deal_open', level: 'warn', text: `Deal Room ${o.dealroom3Sig || 0}`, domain: 'deal' });
  }
  if (force || ((o.partnerdesk3Sig || 0) > 0)) {
    candidates.push({ key: 'partner_idle', level: 'info', text: `Partner idle ${o.partnerdesk3Sig || 0}`, domain: 'partner' });
  }
  if (force || ((o.coinvest3Sig || 0) > 0 || (o.channelkit3Sig || 0) > 0)) {
    candidates.push({ key: 'pipeline', level: 'info', text: `Coinvest ${o.coinvest3Sig || 0} · Channel ${o.channelkit3Sig || 0}`, domain: 'pipeline' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Aether heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('aef'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('aether-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'HERMES-SALES', title: `aether sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('aes'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('aether-sweeps', sweep, 80);
  appendAudit({ actor, action: 'aether.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAether() };
}

export function ackAetherFlag(input = {}, actor = 'system') {
  const list = readCollection('aether-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('aether-flags', list);
  appendAudit({ actor, action: 'aether.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAether() };
}

export function activateAetherPartner(input = {}, actor = 'system') {
  const rows = listPartnerdesk3().filter((x) => x.status === 'idle');
  const activated = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePartnerdesk3(row.id, { status: 'busy', touched_by: actor }, actor);
    if (next) activated.push(next.id);
  }
  if (!activated.length) {
    const seeded = createPartnerdesk3({ partner: 'aether', tier: 'gold', status: 'busy' }, actor);
    activated.push(seeded.id);
  }
  appendAudit({ actor, action: 'aether.partner_activate', detail: `${activated.length}`, meta: { n: activated.length } });
  return { ok: true, activated, overview: buildAether() };
}

export function closeAetherDeal(input = {}, actor = 'system') {
  const rows = listDealroom3().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDealroom3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createDealroom3({ deal: 'aether', owner: 'ops', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const c of listChannelkit3().filter((x) => x.status === 'open').slice(0, 5)) { updateChannelkit3(c.id, { status: 'active', touched_by: actor }, actor); }
  for (const j of listJointpromo3().filter((x) => x.status === 'planned').slice(0, 5)) { updateJointpromo3(j.id, { status: 'doing', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'aether.deal_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildAether() };
}

export function liveAetherCoinvest(input = {}, actor = 'system') {
  const rows = listCoinvest3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateCoinvest3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createCoinvest3({ deal: 'aether', amount: 1, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const b of listB2border3().filter((x) => x.status === 'idle').slice(0, 5)) { updateB2border3(b.id, { status: 'busy', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'HERMES-SALES', title: `aether coinvest_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'aether.coinvest_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildAether() };
}
