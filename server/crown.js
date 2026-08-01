/**
 * AŞAMA 555 — Crown checkpoint.
 */
import { buildOracle } from './oracle.js';
import { createVipdesk, listVipdesk, vipdeskSummary, updateVipdesk } from './vipdesk.js';
import { createGuestcase, listGuestcase, guestcaseSummary, updateGuestcase } from './guestcase.js';
import { createTierladder, listTierladder, tierladderSummary, updateTierladder } from './tierladder.js';
import { createGiftcard, listGiftcard, giftcardSummary, updateGiftcard } from './giftcard.js';
import { createWinback, listWinback, winbackSummary, updateWinback } from './winback.js';
import { createNpspulse, listNpspulse, npspulseSummary, updateNpspulse } from './npspulse.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCrown() {
  const prev = buildOracle();
  const vip = vipdeskSummary();
  const comp = guestcaseSummary();
  const tier = tierladderSummary();
  const gift = giftcardSummary();
  const win = winbackSummary();
  const nps = npspulseSummary();
  const flags = readCollection('crown-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Crown',
    oracle: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    vipInhouse: vip.inhouse || 0,
    complaintOpen: comp.open || 0,
    tierEligible: tier.eligible || 0,
    giftActive: gift.active || 0,
    winLive: win.live || 0,
    npsCaptured: nps.captured || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      complaint_open: comp.open || 0,
      vip_inhouse: vip.inhouse || 0,
      tier_eligible: tier.eligible || 0,
      win_live: win.live || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `VIP in-house ${vip.inhouse || 0} · Complaints open ${comp.open || 0}`,
      `Tier eligible ${tier.eligible || 0} · Gift cards active ${gift.active || 0}`,
      `Winback live ${win.live || 0} · NPS captured ${nps.captured || 0}`,
      `Crown flag ${openFlags.length} açık`,
    ],
  };
}

export function runCrownSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCrown();
  const existing = readCollection('crown-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.complaintOpen || 0) > 0)) {
    candidates.push({ key: 'case', level: 'alert', text: `Complaints open ${o.complaintOpen || 0}`, domain: 'case' });
  }
  if (force || ((o.vipInhouse || 0) === 0 || (o.tierEligible || 0) > 0)) {
    candidates.push({ key: 'vip', level: 'warn', text: `VIP inhouse ${o.vipInhouse || 0} · Tier eligible ${o.tierEligible || 0}`, domain: 'vip' });
  }
  if (force || ((o.winLive || 0) === 0 || (o.npsCaptured || 0) > 0)) {
    candidates.push({ key: 'win', level: 'info', text: `Winback live ${o.winLive || 0} · NPS ${o.npsCaptured || 0}`, domain: 'win' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Crown heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('crwf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('crown-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `crown sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('crws'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('crown-sweeps', sweep, 80);
  appendAudit({ actor, action: 'crown.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCrown() };
}

export function ackCrownFlag(input = {}, actor = 'system') {
  const list = readCollection('crown-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('crown-flags', list);
  appendAudit({ actor, action: 'crown.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCrown() };
}

export function houseCrownVip(input = {}, actor = 'system') {
  const rows = listVipdesk().filter((x) => x.status === 'arriving');
  const housed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateVipdesk(row.id, { status: 'inhouse', touched_by: actor }, actor);
    if (next) housed.push(next.id);
  }
  if (!housed.length) {
    const seeded = createVipdesk({ guestName: 'crown', handler: 'Concierge', status: 'inhouse' }, actor);
    housed.push(seeded.id);
  }
  for (const g of listGiftcard().filter((x) => x.status === 'void').slice(0, 5)) {
    updateGiftcard(g.id, { status: 'active', touched_by: actor }, actor);
  }
  if (!listGiftcard().filter((x) => x.status === 'active').length) {
    createGiftcard({ code: 'CRW-1', balance: 100, status: 'active' }, actor);
  }
  appendAudit({ actor, action: 'crown.vip_house', detail: `${housed.length}`, meta: { n: housed.length } });
  return { ok: true, housed, overview: buildCrown() };
}

export function closeCrownCase(input = {}, actor = 'system') {
  const rows = listGuestcase().filter((x) => x.status === 'open' || x.status === 'working');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateGuestcase(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createGuestcase({ guestName: 'crown', topic: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const n of listNpspulse().filter((x) => x.status === 'captured').slice(0, 5)) {
    updateNpspulse(n.id, { status: 'reviewed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'crown.case_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildCrown() };
}

export function liveCrownWinback(input = {}, actor = 'system') {
  const rows = listWinback().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWinback(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createWinback({ segment: 'crown', offer: '2 nights', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const t of listTierladder().filter((x) => x.status === 'eligible').slice(0, 5)) {
    updateTierladder(t.id, { status: 'upgraded', touched_by: actor }, actor);
  }
  if (!listTierladder().length) {
    createTierladder({ from: 'Silver', to: 'Gold', status: 'upgraded' }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `crown winback_live · ${lived.length}`, priority: 'normal', payload: { ids: lived } }, actor);
  appendAudit({ actor, action: 'crown.winback_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCrown() };
}
