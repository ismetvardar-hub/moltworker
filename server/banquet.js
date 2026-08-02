/**
 * Wave 167 - Banquet event setup ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('banquet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bnq_1',
      eventName: "Düğün",
      pax: "120",
      status: 'inquiry',
      setupDueAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('banquet', seed);
    return seed;
  }
  return list;
}

function openBanquetFlags() {
  const flags = readCollection('banquet-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBanquetFlag(candidate, actor = 'system') {
  const existing = readCollection('banquet-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bnf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('banquet-flags', list.slice(0, 200));
  return flag;
}

function isSetupOverdue(row) {
  if (row.status === 'setup_overdue') return true;
  if (row.status === 'done' || row.status === 'cancelled') return false;
  const due = Date.parse(row.setupDueAt || row.dueAt || row.eventAt || '');
  return Number.isFinite(due) && due < Date.now() && row.setupDone !== true;
}

export function listBanquet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBanquet(input = {}, actor = 'system') {
  const row = {
    id: `bnq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    eventName: input.eventName !== undefined ? input.eventName : "Düğün",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 120,
    room: input.room || input.venue || null,
    eventAt: input.eventAt || null,
    setupDueAt: input.setupDueAt || input.dueAt || null,
    status: input.status || 'inquiry',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('banquet', row, 300);
  appendAudit({
    actor,
    action: 'banquet.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBanquet(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.pax !== undefined) next.pax = Number(next.pax) || 0;
  list[idx] = next;
  writeCollection('banquet', list);
  appendAudit({ actor, action: 'banquet.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function banquetSummary() {
  const list = listBanquet();
  const setupOverdue = list.filter(isSetupOverdue);
  const tastings = list.filter((x) => x.status === 'tasting' || x.tasting === true);
  const flags = openBanquetFlags();
  return {
    title: 'LIKYA Banquet Ops',
    total: list.length,
    inquiry: list.filter((x) => x.status === 'inquiry').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    done: list.filter((x) => x.status === 'done').length,
    setupOverdue: setupOverdue.length,
    tastings: tastings.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      inquiry: list.filter((x) => x.status === 'inquiry').length,
      confirmed: list.filter((x) => x.status === 'confirmed').length,
      done: list.filter((x) => x.status === 'done').length,
      setup_overdue: setupOverdue.length,
      tastings: tastings.length,
      pax_confirmed: list.filter((x) => x.status === 'confirmed').reduce((sum, row) => sum + (Number(row.pax) || 0), 0),
    },
    summaryLines: [
      `Banquet ${list.length} event - confirmed ${list.filter((x) => x.status === 'confirmed').length} - setup overdue ${setupOverdue.length}`,
      `Tastings ${tastings.length} - inquiry ${list.filter((x) => x.status === 'inquiry').length} - flag ${flags.length}`,
    ],
    banquet: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBanquetSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = banquetSummary();
  const created = [];
  const candidates = [];
  if (force || overview.setupOverdue > 0) {
    candidates.push({
      key: 'banquet_setup_overdue',
      level: overview.setupOverdue > 0 ? 'warn' : 'info',
      text: `Banquet setup overdue ${overview.setupOverdue}`,
      domain: 'setup',
    });
  }
  if (force || overview.inquiry > overview.confirmed) {
    candidates.push({
      key: 'banquet_confirm_backlog',
      level: overview.inquiry > overview.confirmed ? 'warn' : 'info',
      text: `Banquet inquiry backlog ${overview.inquiry}`,
      domain: 'sales',
    });
  }
  if (force || overview.tastings > 0) {
    candidates.push({
      key: 'banquet_tasting_queue',
      level: overview.tastings > 0 ? 'info' : 'info',
      text: `Banquet tasting queue ${overview.tastings}`,
      domain: 'culinary',
    });
  }
  for (const candidate of candidates) {
    const flag = addBanquetFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `banquet sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('banquet-sweeps', sweep, 80);
  appendAudit({ actor, action: 'banquet.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: banquetSummary() };
}

export function ackBanquetFlag(input = {}, actor = 'system') {
  const list = readCollection('banquet-flags', []) || [];
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
  writeCollection('banquet-flags', list);
  appendAudit({ actor, action: 'banquet.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: banquetSummary() };
}

export function markBanquetSetupOverdue(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.eventName && x.eventName === input.eventName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done' && x.status !== 'cancelled');
  if (idx < 0) return { ok: false, error: 'Setup overdue yapilacak banket yok' };
  list[idx] = {
    ...list[idx],
    status: 'setup_overdue',
    setupDueAt: input.setupDueAt || new Date(Date.now() - 60_000).toISOString(),
    setupOverdueAt: input.setupOverdueAt || new Date().toISOString(),
    setupOwner: input.setupOwner || list[idx].setupOwner || 'Banquet',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('banquet', list);
  appendAudit({ actor, action: 'banquet.setup_overdue', detail: list[idx].eventName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, banquet: list[idx], overview: banquetSummary() };
}

export function confirmBanquetEvent(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.eventName && x.eventName === input.eventName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'confirmed' && x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Confirm edilecek banket yok' };
  list[idx] = {
    ...list[idx],
    status: 'confirmed',
    pax: Number(input.pax ?? list[idx].pax ?? 0) || 0,
    deposit: Number(input.deposit ?? list[idx].deposit ?? 0) || 0,
    confirmedAt: input.confirmedAt || new Date().toISOString(),
    confirmedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('banquet', list);
  appendAudit({ actor, action: 'banquet.confirm_event', detail: list[idx].eventName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, banquet: list[idx], overview: banquetSummary() };
}

export function seedBanquetTasting(input = {}, actor = 'system') {
  const banquet = createBanquet(
    {
      eventName: input.eventName || 'Tasting event',
      pax: Number(input.pax ?? 8) || 8,
      room: input.room || 'Chef table',
      status: input.status || 'tasting',
      eventAt: input.eventAt || new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
      setupDueAt: input.setupDueAt || new Date(Date.now() + 60 * 60_000).toISOString(),
    },
    actor,
  );
  updateBanquet(banquet.id, { tasting: true, menu: input.menu || 'Tasting menu' }, actor);
  appendAudit({ actor, action: 'banquet.seed_tasting', detail: banquet.eventName, meta: { id: banquet.id } });
  return { ok: true, banquet: { ...banquet, tasting: true, menu: input.menu || 'Tasting menu' }, overview: banquetSummary() };
}
