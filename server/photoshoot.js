import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 179 - Photoshoot permit and brand shoot ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('photoshoot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'phs_1',
      guestName: "Misafir",
      slot: "17:00",
      status: 'booked',
      permitStatus: 'approved',
      at: new Date().toISOString(),
    }];
    writeCollection('photoshoot', seed);
    return seed;
  }
  return list;
}

function openPhotoshootFlags() {
  const flags = readCollection('photoshoot-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPhotoshootFlag(candidate, actor = 'system') {
  const existing = readCollection('photoshoot-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('phsf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('photoshoot-flags', list.slice(0, 200));
  return flag;
}

function isPermitPending(row) {
  return row.permitPending === true || row.permitStatus === 'pending' || row.status === 'permit_pending';
}

function isApprovedSlot(row) {
  return row.status === 'approved' || row.permitStatus === 'approved' || Boolean(row.approvedAt);
}

function isBrandShoot(row) {
  return row.brandShoot === true || row.type === 'brand' || row.status === 'brand_shoot';
}

export function listPhotoshoot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPhotoshoot(input = {}, actor = 'system') {
  const row = {
    id: rid('phs'),
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    slot: input.slot !== undefined ? input.slot : "17:00",
    location: input.location || null,
    type: input.type || (input.brandShoot ? 'brand' : 'guest'),
    brand: input.brand || null,
    permitStatus: input.permitStatus || (input.status === 'permit_pending' ? 'pending' : 'approved'),
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('photoshoot', row, 300);
  appendAudit({
    actor,
    action: 'photoshoot.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePhotoshoot(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('photoshoot', list);
  appendAudit({ actor, action: 'photoshoot.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function photoshootSummary() {
  const list = listPhotoshoot();
  const permitPending = list.filter(isPermitPending);
  const approvedSlots = list.filter(isApprovedSlot);
  const brandShoots = list.filter(isBrandShoot);
  const flags = openPhotoshootFlags();
  return {
    title: 'LIKYA Photoshoot Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    approved: approvedSlots.length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    permitPending: permitPending.length,
    brandShoots: brandShoots.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      approved: approvedSlots.length,
      done: list.filter((x) => x.status === 'done').length,
      cancelled: list.filter((x) => x.status === 'cancelled').length,
      permit_pending: permitPending.length,
      brand_shoots: brandShoots.length,
    },
    summaryLines: [
      `Photoshoot ${list.length} slot - permit pending ${permitPending.length} - approved ${approvedSlots.length}`,
      `Brand shoots ${brandShoots.length} - done ${list.filter((x) => x.status === 'done').length} - flags ${flags.length}`,
    ],
    photoshoot: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPhotoshootSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = photoshootSummary();
  const created = [];
  const candidates = [];
  if (force || overview.permitPending > 0) {
    candidates.push({
      key: 'photoshoot_permit_pending',
      level: overview.permitPending > 0 ? 'warn' : 'info',
      text: `Photoshoot permits pending ${overview.permitPending}`,
      domain: 'permit',
    });
  }
  if (force || overview.booked > overview.approved) {
    candidates.push({
      key: 'photoshoot_slot_approval',
      level: overview.booked > overview.approved ? 'warn' : 'info',
      text: `Photoshoot booked ${overview.booked} approved ${overview.approved}`,
      domain: 'slot',
    });
  }
  if (force || overview.brandShoots === 0) {
    candidates.push({
      key: 'photoshoot_brand_shoot_seed',
      level: 'info',
      text: `Photoshoot brand shoots ${overview.brandShoots}`,
      domain: 'brand',
    });
  }
  for (const candidate of candidates) {
    const flag = addPhotoshootFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `photoshoot sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('phss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('photoshoot-sweeps', sweep, 80);
  appendAudit({ actor, action: 'photoshoot.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: photoshootSummary() };
}

export function ackPhotoshootFlag(input = {}, actor = 'system') {
  const list = readCollection('photoshoot-flags', []) || [];
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
  writeCollection('photoshoot-flags', list);
  appendAudit({ actor, action: 'photoshoot.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: photoshootSummary() };
}

export function markPhotoshootPermitPending(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isPermitPending(x));
  if (idx < 0) return { ok: false, error: 'Permit pending yapilacak photoshoot slot yok' };
  list[idx] = {
    ...list[idx],
    status: 'permit_pending',
    permitStatus: 'pending',
    permitPending: true,
    permitReason: input.reason || input.permitReason || 'brand_usage_review',
    permitDueAt: input.permitDueAt || new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
    permitPendingAt: input.permitPendingAt || new Date().toISOString(),
    permitPendingBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('photoshoot', list);
  appendAudit({ actor, action: 'photoshoot.permit_pending', detail: list[idx].guestName || list[idx].slot, meta: { id: list[idx].id } });
  return { ok: true, shoot: list[idx], overview: photoshootSummary() };
}

export function approvePhotoshootSlot(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'approved' && x.status !== 'done' && x.status !== 'cancelled');
  if (idx < 0) return { ok: false, error: 'Approve edilecek photoshoot slot yok' };
  list[idx] = {
    ...list[idx],
    status: 'approved',
    permitStatus: 'approved',
    permitPending: false,
    approvedAt: input.approvedAt || new Date().toISOString(),
    approvedBy: actor,
    slot: input.slot || list[idx].slot,
    location: input.location || list[idx].location || 'brand deck',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('photoshoot', list);
  appendAudit({ actor, action: 'photoshoot.slot_approve', detail: list[idx].guestName || list[idx].slot, meta: { id: list[idx].id } });
  return { ok: true, shoot: list[idx], overview: photoshootSummary() };
}

export function seedBrandShoot(input = {}, actor = 'system') {
  const shoot = createPhotoshoot(
    {
      guestName: input.guestName || 'Brand team',
      slot: input.slot || '10:30',
      location: input.location || 'beach club',
      brand: input.brand || 'LIKYA',
      type: 'brand',
      brandShoot: true,
      permitStatus: input.permitStatus || 'pending',
      status: input.status || 'permit_pending',
    },
    actor,
  );
  updatePhotoshoot(shoot.id, { brandShoot: true, permitPending: true, brandShootAt: input.brandShootAt || new Date().toISOString() }, actor);
  appendAudit({ actor, action: 'photoshoot.seed_brand_shoot', detail: shoot.brand || shoot.guestName, meta: { id: shoot.id } });
  return {
    ok: true,
    shoot: { ...shoot, brandShoot: true, permitPending: true, brandShootAt: input.brandShootAt || new Date().toISOString() },
    overview: photoshootSummary(),
  };
}
