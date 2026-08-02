/**
 * AŞAMA 63 — Hediye Kartları.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('gift-cards', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'gc_1',
        code: 'GIFT-LYK-01',
        balance: 500,
        holder: 'Ayşe T.',
        status: 'active',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('gift-cards', seed);
    return seed;
  }
  return list;
}

function openGiftcardsFlags() {
  const flags = readCollection('giftcards-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addGiftcardsFlag(candidate, actor = 'system') {
  const existing = readCollection('giftcards-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('gcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('giftcards-flags', list.slice(0, 200));
  return flag;
}

export function listGiftcards(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createGiftcards(input = {}, actor = 'system') {
  const row = {
    id: `gif_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : 'GIFT-NEW',
    balance: Number(input.balance ?? 250) || 0,
    holder: input.holder !== undefined ? input.holder : 'Misafir',
    status: input.status || 'active',
    campaign: input.campaign || null,
    expiresAt: input.expiresAt || null,
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('gift-cards', row, 300);
  appendAudit({ actor, action: 'giftcards.create', detail: String(row.code || row.holder || row.id), meta: { id: row.id } });
  return row;
}

export function updateGiftcards(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.balance !== undefined) next.balance = Number(next.balance) || 0;
  list[idx] = next;
  writeCollection('gift-cards', list);
  appendAudit({ actor, action: 'giftcards.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function giftcardsSummary() {
  const list = listGiftcards();
  const lowThreshold = 75;
  const lowBalance = list.filter((x) => x.status === 'active' && Number(x.balance || 0) > 0 && Number(x.balance || 0) <= lowThreshold);
  const zeroBalance = list.filter((x) => x.status === 'active' && Number(x.balance || 0) <= 0);
  const flags = openGiftcardsFlags();
  return {
    title: 'LİKYA Hediye Kart Ops',
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    redeemed: list.filter((x) => x.status === 'redeemed').length,
    voided: list.filter((x) => x.status === 'void').length,
    lowBalance: lowBalance.length,
    zeroBalance: zeroBalance.length,
    liabilityTry: list
      .filter((x) => x.status === 'active')
      .reduce((sum, x) => sum + Number(x.balance || 0), 0),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => x.status === 'active').length,
      redeemed: list.filter((x) => x.status === 'redeemed').length,
      low_balance: lowBalance.length,
      zero_balance: zeroBalance.length,
      liability_try: list.filter((x) => x.status === 'active').reduce((sum, x) => sum + Number(x.balance || 0), 0),
    },
    summaryLines: [
      `Giftcard ${list.length} · aktif ${list.filter((x) => x.status === 'active').length} · bakiye düşük ${lowBalance.length}`,
      `Redeem ${list.filter((x) => x.status === 'redeemed').length} · yükümlülük ${list.filter((x) => x.status === 'active').reduce((sum, x) => sum + Number(x.balance || 0), 0)} TRY · flag ${flags.length}`,
    ],
    cards: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runGiftcardsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = giftcardsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.lowBalance > 0) {
    candidates.push({
      key: 'giftcards_low_balance',
      level: overview.lowBalance > 0 ? 'warn' : 'info',
      text: `Düşük bakiyeli hediye kart ${overview.lowBalance}`,
      domain: 'balance',
    });
  }
  if (force || overview.zeroBalance > 0) {
    candidates.push({
      key: 'giftcards_zero_balance_active',
      level: overview.zeroBalance > 0 ? 'alert' : 'info',
      text: `Aktif ama sıfır bakiye kart ${overview.zeroBalance}`,
      domain: 'redemption',
    });
  }
  if (force || overview.liabilityTry > 5000) {
    candidates.push({
      key: 'giftcards_liability_watch',
      level: overview.liabilityTry > 5000 ? 'warn' : 'info',
      text: `Giftcard yükümlülük ${overview.liabilityTry} TRY`,
      domain: 'finance',
    });
  }
  for (const candidate of candidates) {
    const flag = addGiftcardsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HERMES-SALES',
        title: `giftcards sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('gcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('giftcards-sweeps', sweep, 80);
  appendAudit({ actor, action: 'giftcards.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: giftcardsSummary() };
}

export function ackGiftcardsFlag(input = {}, actor = 'system') {
  const list = readCollection('giftcards-flags', []) || [];
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
  writeCollection('giftcards-flags', list);
  appendAudit({ actor, action: 'giftcards.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: giftcardsSummary() };
}

export function redeemGiftcardOps(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id || x.code === input.code) >= 0
    ? list.findIndex((x) => x.id === input.id || x.code === input.code)
    : list.findIndex((x) => x.status === 'active' && Number(x.balance || 0) > 0);
  if (idx < 0) return { ok: false, error: 'Redeem edilecek aktif kart yok' };
  const amount = Math.min(Number(input.amount ?? 50) || 50, Number(list[idx].balance || 0));
  const balance = Math.max(0, Number(list[idx].balance || 0) - amount);
  list[idx] = {
    ...list[idx],
    balance,
    status: balance <= 0 ? 'redeemed' : list[idx].status,
    redeemedAt: balance <= 0 ? new Date().toISOString() : list[idx].redeemedAt,
    lastRedeemedAt: new Date().toISOString(),
    lastRedeemedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('gift-cards', list);
  appendAudit({ actor, action: 'giftcards.redeem', detail: `${list[idx].code} -${amount}`, meta: { id: list[idx].id } });
  return { ok: true, card: list[idx], amount, overview: giftcardsSummary() };
}

export function topUpGiftcardOps(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id || x.code === input.code);
  const targetIdx = idx >= 0 ? idx : list.findIndex((x) => x.status === 'active');
  if (targetIdx < 0) return { ok: false, error: 'Yüklenecek kart yok' };
  const amount = Number(input.amount ?? 100) || 100;
  list[targetIdx] = {
    ...list[targetIdx],
    balance: Number(list[targetIdx].balance || 0) + amount,
    status: 'active',
    toppedUpAt: new Date().toISOString(),
    toppedUpBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('gift-cards', list);
  appendAudit({ actor, action: 'giftcards.topup', detail: `${list[targetIdx].code} +${amount}`, meta: { id: list[targetIdx].id } });
  return { ok: true, card: list[targetIdx], amount, overview: giftcardsSummary() };
}

export function seedPromoGiftcard(input = {}, actor = 'system') {
  const card = createGiftcards(
    {
      code: input.code || `PROMO-${Date.now().toString(36).toUpperCase()}`,
      balance: Number(input.balance ?? 100),
      holder: input.holder || 'Ops promo guest',
      status: 'active',
      campaign: input.campaign || 'ops-promo',
    },
    actor,
  );
  appendAudit({ actor, action: 'giftcards.seed_promo', detail: card.code, meta: { id: card.id } });
  return { ok: true, card, overview: giftcardsSummary() };
}
