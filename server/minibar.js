/**
 * AŞAMA 92 — Minibar.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const ACTIVE_STATUSES = new Set(['pending', 'empty', 'restock_due']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('minibar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [{
      id: 'mnb_1',
      room: "101",
      item: "Su",
      status: 'pending',
      qty: 2,
      minQty: 4,
      amount: 0,
      dueAt: new Date(now.getTime() + 2 * HOUR_MS).toISOString(),
      at: now.toISOString(),
    }];
    writeCollection('minibar', seed);
    return seed;
  }
  return list;
}

function isRestockDue(row) {
  if (!ACTIVE_STATUSES.has(row.status)) return false;
  if (Number(row.qty ?? row.count ?? 0) <= Number(row.minQty ?? 1)) return true;
  const dueAt = Date.parse(row.dueAt || row.restockDueAt || '');
  if (Number.isFinite(dueAt)) return dueAt <= Date.now();
  const started = Date.parse(row.at || row.createdAt || '');
  return Number.isFinite(started) && started + Number(row.slaHours || 6) * HOUR_MS <= Date.now();
}

function openMinibarFlags() {
  const flags = readCollection('minibar-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMinibarFlag(candidate, actor = 'system') {
  const existing = readCollection('minibar-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('mnf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('minibar-flags', list.slice(0, 200));
  return flag;
}

export function listMinibar(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createMinibar(input = {}, actor = 'system') {
  const row = {
    id: `mnb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "101",
    item: input.item !== undefined ? input.item : "Su",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 2,
    minQty: input.minQty !== undefined ? Number(input.minQty) || 0 : 4,
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 0,
    guestName: input.guestName || null,
    folioId: input.folioId || null,
    dueAt: input.dueAt || input.restockDueAt || null,
    status: input.status || 'pending',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('minibar', row, 300);
  appendAudit({
    actor,
    action: 'minibar.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMinibar(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  for (const key of ['qty', 'minQty', 'amount']) {
    if (next[key] !== undefined) next[key] = Number(next[key]) || 0;
  }
  list[idx] = next;
  writeCollection('minibar', list);
  appendAudit({ actor, action: 'minibar.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function minibarSummary() {
  const list = listMinibar();
  const restockDue = list.filter(isRestockDue);
  const empty = list.filter((x) => x.status === 'empty' || Number(x.qty ?? 0) <= 0);
  const billedAmount = list
    .filter((x) => x.status === 'billed')
    .reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const flags = openMinibarFlags();
  return {
    title: 'LİKYA Minibar Ops',
    total: list.length,
    pending: list.filter((x) => x.status === 'pending').length,
    restocked: list.filter((x) => x.status === 'restocked').length,
    billed: list.filter((x) => x.status === 'billed').length,
    empty: empty.length,
    restockDue: restockDue.length,
    billedAmount,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      pending: list.filter((x) => x.status === 'pending').length,
      restocked: list.filter((x) => x.status === 'restocked').length,
      billed: list.filter((x) => x.status === 'billed').length,
      empty: empty.length,
      restock_due: restockDue.length,
      billed_amount: billedAmount,
    },
    summaryLines: [
      `Minibar ${list.length} oda · restock due ${restockDue.length} · empty ${empty.length}`,
      `Billed ${list.filter((x) => x.status === 'billed').length} · amount ${billedAmount} TRY · flag ${flags.length}`,
    ],
    minibar: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runMinibarSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = minibarSummary();
  const created = [];
  const candidates = [];
  if (force || overview.restockDue > 0) {
    candidates.push({
      key: 'minibar_restock_due',
      level: overview.restockDue > 0 ? 'warn' : 'info',
      text: `Restock due minibar ${overview.restockDue}`,
      domain: 'restock',
    });
  }
  if (force || overview.empty > 0) {
    candidates.push({
      key: 'minibar_empty_fridges',
      level: overview.empty > 0 ? 'alert' : 'info',
      text: `Boş minibar buzdolabı ${overview.empty}`,
      domain: 'fridge',
    });
  }
  if (force || overview.billedAmount > 0) {
    candidates.push({
      key: 'minibar_folio_charges',
      level: 'info',
      text: `Folioya işlenen minibar ${overview.billedAmount} TRY`,
      domain: 'folio',
    });
  }
  for (const candidate of candidates) {
    const flag = addMinibarFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HERMES',
        title: `minibar sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('mns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('minibar-sweeps', sweep, 80);
  appendAudit({ actor, action: 'minibar.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: minibarSummary() };
}

export function ackMinibarFlag(input = {}, actor = 'system') {
  const list = readCollection('minibar-flags', []) || [];
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
  writeCollection('minibar-flags', list);
  appendAudit({ actor, action: 'minibar.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: minibarSummary() };
}

export function restockDueMinibar(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isRestockDue);
  if (idx < 0) return { ok: false, error: 'Restock due minibar yok' };
  list[idx] = {
    ...list[idx],
    status: 'restocked',
    qty: Number(input.qty ?? list[idx].targetQty ?? list[idx].minQty ?? 4) || 4,
    restockedAt: input.restockedAt || new Date().toISOString(),
    restockedBy: actor,
    dueAt: input.nextDueAt || new Date(Date.now() + 12 * HOUR_MS).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeCollection('minibar', list);
  appendAudit({ actor, action: 'minibar.restock_due', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, item: list[idx], overview: minibarSummary() };
}

export function chargeMinibarFolio(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'billed');
  if (idx < 0) return { ok: false, error: 'Folioya işlenecek minibar yok' };
  const amount = Number(input.amount ?? list[idx].amount ?? 75) || 75;
  list[idx] = {
    ...list[idx],
    amount,
    status: 'billed',
    folioId: input.folioId || list[idx].folioId || `folio_${list[idx].room || 'guest'}`,
    chargedAt: input.chargedAt || new Date().toISOString(),
    chargedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('minibar', list);
  appendAudit({ actor, action: 'minibar.charge_folio', detail: `${list[idx].room || list[idx].id} ${amount}`, meta: { id: list[idx].id } });
  return { ok: true, item: list[idx], amount, overview: minibarSummary() };
}

export function seedEmptyMinibarFridge(input = {}, actor = 'system') {
  const item = createMinibar(
    {
      room: input.room || '416',
      item: input.item || 'Empty fridge sweep',
      qty: 0,
      minQty: Number(input.minQty ?? 4),
      amount: Number(input.amount ?? 0),
      status: 'empty',
      dueAt: input.dueAt || new Date(Date.now() - HOUR_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'minibar.seed_empty_fridge', detail: item.room, meta: { id: item.id } });
  return { ok: true, item, overview: minibarSummary() };
}
