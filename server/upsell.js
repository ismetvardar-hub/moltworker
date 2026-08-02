/**
 * Wave 166 - Upsell offer ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('upsell', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ups_1',
      offer: 'Suite upgrade',
      guestName: 'Misafir',
      status: 'offered',
      expiresAt: new Date(Date.now() + 4 * HOUR_MS).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('upsell', seed);
    return seed;
  }
  return list;
}

function openUpsellFlags() {
  const flags = readCollection('upsell-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addUpsellFlag(candidate, actor = 'system') {
  const existing = readCollection('upsell-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('upf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('upsell-flags', list.slice(0, 200));
  return flag;
}

function isPendingOffer(row) {
  return row.status === 'pending' || row.status === 'offered' || row.status === 'aging';
}

function isPendingOfferAging(row) {
  if (row.status === 'aging') return true;
  if (!isPendingOffer(row)) return false;
  const expiresAt = Date.parse(row.expiresAt || row.until || '');
  if (Number.isFinite(expiresAt)) return expiresAt < Date.now();
  const started = Date.parse(row.at || row.createdAt || '');
  const agingHours = Number(row.agingHours || 4);
  return Number.isFinite(started) && started + agingHours * HOUR_MS < Date.now();
}

export function listUpsell(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createUpsell(input = {}, actor = 'system') {
  const agingHours = Number(input.agingHours ?? 4) || 4;
  const row = {
    id: `ups_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    offer: input.offer !== undefined ? input.offer : 'Suite upgrade',
    guestName: input.guestName !== undefined ? input.guestName : 'Misafir',
    room: input.room || null,
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 0,
    agingHours,
    expiresAt: input.expiresAt || input.until || new Date(Date.now() + agingHours * HOUR_MS).toISOString(),
    status: input.status || 'offered',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('upsell', row, 300);
  appendAudit({
    actor,
    action: 'upsell.create',
    detail: String(row.offer || row.guestName || row.room || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateUpsell(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  for (const key of ['amount', 'agingHours']) {
    if (next[key] !== undefined) next[key] = Number(next[key]) || 0;
  }
  list[idx] = next;
  writeCollection('upsell', list);
  appendAudit({ actor, action: 'upsell.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function upsellSummary() {
  const list = listUpsell();
  const pending = list.filter(isPendingOffer);
  const pendingAging = list.filter(isPendingOfferAging);
  const lateCheckout = list.filter((x) => String(x.offer || '').toLowerCase().includes('late checkout') || x.type === 'late_checkout');
  const flags = openUpsellFlags();
  return {
    title: 'LIKYA Upsell Ops',
    total: list.length,
    offered: list.filter((x) => x.status === 'offered').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    declined: list.filter((x) => x.status === 'declined').length,
    pending: pending.length,
    pendingAging: pendingAging.length,
    lateCheckout: lateCheckout.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      offered: list.filter((x) => x.status === 'offered').length,
      accepted: list.filter((x) => x.status === 'accepted').length,
      declined: list.filter((x) => x.status === 'declined').length,
      pending: pending.length,
      pending_aging: pendingAging.length,
      late_checkout: lateCheckout.length,
    },
    summaryLines: [
      `Upsell ${list.length} offer - pending ${pending.length} - aging ${pendingAging.length}`,
      `Accepted ${list.filter((x) => x.status === 'accepted').length} - late checkout ${lateCheckout.length} - flag ${flags.length}`,
    ],
    upsell: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runUpsellSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = upsellSummary();
  const created = [];
  const candidates = [];
  if (force || overview.pendingAging > 0) {
    candidates.push({
      key: 'upsell_pending_offer_aging',
      level: overview.pendingAging > 0 ? 'warn' : 'info',
      text: `Pending aging upsell offers ${overview.pendingAging}`,
      domain: 'aging',
    });
  }
  if (force || overview.pending > 0) {
    candidates.push({
      key: 'upsell_pending_offers',
      level: overview.pending > 10 ? 'warn' : 'info',
      text: `Pending upsell offers ${overview.pending}`,
      domain: 'offer',
    });
  }
  if (force || overview.lateCheckout > 0) {
    candidates.push({
      key: 'upsell_late_checkout_offers',
      level: 'info',
      text: `Late checkout offers ${overview.lateCheckout}`,
      domain: 'late_checkout',
    });
  }
  for (const candidate of candidates) {
    const flag = addUpsellFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `upsell sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('ups'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('upsell-sweeps', sweep, 80);
  appendAudit({ actor, action: 'upsell.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: upsellSummary() };
}

export function ackUpsellFlag(input = {}, actor = 'system') {
  const list = readCollection('upsell-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('upsell-flags', list);
  appendAudit({ actor, action: 'upsell.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: upsellSummary() };
}

export function ageUpsellPendingOffer(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isPendingOffer);
  if (idx < 0) return { ok: false, error: 'Aging yapilacak upsell offer yok' };
  list[idx] = {
    ...list[idx],
    status: 'aging',
    expiresAt: input.expiresAt || new Date(Date.now() - HOUR_MS).toISOString(),
    agingReason: input.reason || input.agingReason || 'Pending offer aging',
    agedAt: input.agedAt || new Date().toISOString(),
    agedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('upsell', list);
  appendAudit({ actor, action: 'upsell.offer_age', detail: list[idx].offer || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, offer: list[idx], overview: upsellSummary() };
}

export function acceptUpsellOffer(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'accepted' && x.status !== 'declined');
  if (idx < 0) return { ok: false, error: 'Accept edilecek upsell offer yok' };
  list[idx] = {
    ...list[idx],
    status: 'accepted',
    acceptedAt: input.acceptedAt || new Date().toISOString(),
    acceptedBy: actor,
    acceptanceNote: input.note || input.acceptanceNote || 'Upsell offer accepted',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('upsell', list);
  appendAudit({ actor, action: 'upsell.accept', detail: list[idx].offer || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, offer: list[idx], overview: upsellSummary() };
}

export function seedLateCheckoutOffer(input = {}, actor = 'system') {
  const offer = createUpsell(
    {
      offer: input.offer || 'Late checkout offer',
      guestName: input.guestName || 'Late checkout guest',
      room: input.room || '214',
      type: 'late_checkout',
      amount: Number(input.amount ?? 75),
      status: input.status || 'pending',
      agingHours: Number(input.agingHours ?? 2),
      expiresAt: input.expiresAt || new Date(Date.now() - HOUR_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'upsell.seed_late_checkout', detail: offer.offer, meta: { id: offer.id } });
  return { ok: true, offer, overview: upsellSummary() };
}
