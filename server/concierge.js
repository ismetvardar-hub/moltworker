/**
 * AŞAMA 91 — Concierge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const ACTIVE_STATUSES = new Set(['open', 'doing', 'aging', 'vip']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('concierge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [{
      id: 'cnc_1',
      request: "Transfer talebi",
      guestName: "Misafir",
      priority: 'normal',
      slaHours: 4,
      dueAt: new Date(now.getTime() + 4 * HOUR_MS).toISOString(),
      status: 'open',
      at: now.toISOString(),
    }];
    writeCollection('concierge', seed);
    return seed;
  }
  return list;
}

function isAgingRequest(row) {
  if (row.status === 'aging') return true;
  if (!ACTIVE_STATUSES.has(row.status)) return false;
  const dueAt = Date.parse(row.dueAt || '');
  if (Number.isFinite(dueAt)) return dueAt <= Date.now();
  const started = Date.parse(row.at || row.createdAt || '');
  return Number.isFinite(started) && started + Number(row.slaHours || 4) * HOUR_MS <= Date.now();
}

function openConciergeFlags() {
  const flags = readCollection('concierge-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addConciergeFlag(candidate, actor = 'system') {
  const existing = readCollection('concierge-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('cnf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('concierge-flags', list.slice(0, 200));
  return flag;
}

export function listConcierge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createConcierge(input = {}, actor = 'system') {
  const row = {
    id: `cnc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    request: input.request !== undefined ? input.request : "Transfer talebi",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    priority: input.priority || 'normal',
    owner: input.owner || null,
    slaHours: input.slaHours !== undefined ? Number(input.slaHours) || 0 : 4,
    dueAt: input.dueAt || null,
    fulfilledAt: input.fulfilledAt || null,
    status: input.status || 'open',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('concierge', row, 300);
  appendAudit({
    actor,
    action: 'concierge.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateConcierge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.slaHours !== undefined) next.slaHours = Number(next.slaHours) || 0;
  list[idx] = next;
  writeCollection('concierge', list);
  appendAudit({ actor, action: 'concierge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function conciergeSummary() {
  const list = listConcierge();
  const aging = list.filter(isAgingRequest);
  const vip = list.filter((x) => x.priority === 'vip' || x.status === 'vip' || !!x.vip);
  const flags = openConciergeFlags();
  return {
    title: 'LİKYA Concierge Ops',
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length,
    aging: aging.length,
    vip: vip.length,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      open: list.filter((x) => x.status === 'open').length,
      doing: list.filter((x) => x.status === 'doing').length,
      done: list.filter((x) => x.status === 'done').length,
      aging: aging.length,
      vip: vip.length,
      active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    },
    summaryLines: [
      `Concierge ${list.length} request · open ${list.filter((x) => x.status === 'open').length} · aging ${aging.length}`,
      `VIP ${vip.length} · doing ${list.filter((x) => x.status === 'doing').length} · flag ${flags.length}`,
    ],
    concierge: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runConciergeSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = conciergeSummary();
  const created = [];
  const candidates = [];
  if (force || overview.aging > 0) {
    candidates.push({
      key: 'concierge_open_request_aging',
      level: overview.aging > 0 ? 'warn' : 'info',
      text: `Aging concierge request ${overview.aging}`,
      domain: 'aging',
    });
  }
  if (force || overview.open > 0) {
    candidates.push({
      key: 'concierge_open_queue',
      level: overview.open > 5 ? 'alert' : 'info',
      text: `Açık concierge request ${overview.open}`,
      domain: 'queue',
    });
  }
  if (force || overview.vip > 0) {
    candidates.push({
      key: 'concierge_vip_asks',
      level: overview.vip > 0 ? 'warn' : 'info',
      text: `VIP concierge ask ${overview.vip}`,
      domain: 'vip',
    });
  }
  for (const candidate of candidates) {
    const flag = addConciergeFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HERMES',
        title: `concierge sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('concierge-sweeps', sweep, 80);
  appendAudit({ actor, action: 'concierge.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: conciergeSummary() };
}

export function ackConciergeFlag(input = {}, actor = 'system') {
  const list = readCollection('concierge-flags', []) || [];
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
  writeCollection('concierge-flags', list);
  appendAudit({ actor, action: 'concierge.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: conciergeSummary() };
}

export function ageConciergeRequest(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Aging yapılacak concierge request yok' };
  list[idx] = {
    ...list[idx],
    status: 'aging',
    priority: input.priority || list[idx].priority || 'high',
    dueAt: input.dueAt || new Date(Date.now() - HOUR_MS).toISOString(),
    agingReason: input.reason || input.agingReason || 'Open request aging',
    agedAt: input.agedAt || new Date().toISOString(),
    agedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('concierge', list);
  appendAudit({ actor, action: 'concierge.age_request', detail: list[idx].request || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, request: list[idx], overview: conciergeSummary() };
}

export function fulfillConciergeRequest(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Fulfill edilecek concierge request yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    fulfillmentNote: input.note || input.fulfillmentNote || 'Fulfilled by ops',
    fulfilledAt: input.fulfilledAt || new Date().toISOString(),
    fulfilledBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('concierge', list);
  appendAudit({ actor, action: 'concierge.fulfill', detail: list[idx].request || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, request: list[idx], overview: conciergeSummary() };
}

export function seedVipConciergeAsk(input = {}, actor = 'system') {
  const request = createConcierge(
    {
      request: input.request || 'VIP cabana + chef ask',
      guestName: input.guestName || 'VIP Guest',
      priority: 'vip',
      status: input.status || 'vip',
      slaHours: Number(input.slaHours ?? 1),
      dueAt: input.dueAt || new Date(Date.now() + HOUR_MS).toISOString(),
      owner: input.owner || 'Ops concierge',
    },
    actor,
  );
  appendAudit({ actor, action: 'concierge.seed_vip_ask', detail: request.guestName, meta: { id: request.id } });
  return { ok: true, request, overview: conciergeSummary() };
}
