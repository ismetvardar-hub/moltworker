/**
 * Wave 167 - Beachbed and cabana ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('beach-beds', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bea_1',
      bedNo: "S-14",
      guestName: "Misafir",
      status: 'free',
      paid: true,
      at: new Date().toISOString(),
    }];
    writeCollection('beach-beds', seed);
    return seed;
  }
  return list;
}

function openBeachbedsFlags() {
  const flags = readCollection('beachbeds-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBeachbedsFlag(candidate, actor = 'system') {
  const existing = readCollection('beachbeds-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bbf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('beachbeds-flags', list.slice(0, 200));
  return flag;
}

function isUnpaidDaybed(row) {
  if (row.status === 'unpaid') return true;
  return row.paid === false || Number(row.balanceDue || 0) > 0;
}

export function listBeachbeds(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBeachbeds(input = {}, actor = 'system') {
  const row = {
    id: `bea_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bedNo: input.bedNo !== undefined ? input.bedNo : "S-14",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    zone: input.zone || input.area || null,
    paid: input.paid !== undefined ? input.paid !== false : true,
    balanceDue: Number(input.balanceDue ?? input.amount ?? 0) || 0,
    cabana: input.cabana === true,
    vip: input.vip === true,
    status: input.status || 'free',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('beach-beds', row, 300);
  appendAudit({
    actor,
    action: 'beachbeds.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBeachbeds(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.balanceDue !== undefined) next.balanceDue = Number(next.balanceDue) || 0;
  list[idx] = next;
  writeCollection('beach-beds', list);
  appendAudit({ actor, action: 'beachbeds.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function beachbedsSummary() {
  const list = listBeachbeds();
  const unpaid = list.filter(isUnpaidDaybed);
  const checkedIn = list.filter((x) => x.status === 'occupied' || x.checkedInAt);
  const vipCabanas = list.filter((x) => x.vip === true && x.cabana === true);
  const flags = openBeachbedsFlags();
  return {
    title: 'LIKYA Beachbeds Ops',
    total: list.length,
    free: list.filter((x) => x.status === 'free').length,
    reserved: list.filter((x) => x.status === 'reserved').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    unpaid: unpaid.length,
    checkedIn: checkedIn.length,
    vipCabanas: vipCabanas.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      free: list.filter((x) => x.status === 'free').length,
      reserved: list.filter((x) => x.status === 'reserved').length,
      occupied: list.filter((x) => x.status === 'occupied').length,
      unpaid: unpaid.length,
      checked_in: checkedIn.length,
      vip_cabanas: vipCabanas.length,
    },
    summaryLines: [
      `Beachbeds ${list.length} bed - occupied ${checkedIn.length} - unpaid ${unpaid.length}`,
      `VIP cabanas ${vipCabanas.length} - free ${list.filter((x) => x.status === 'free').length} - flag ${flags.length}`,
    ],
    beds: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBeachbedsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = beachbedsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.unpaid > 0) {
    candidates.push({
      key: 'beachbeds_unpaid_daybed',
      level: overview.unpaid > 0 ? 'warn' : 'info',
      text: `Unpaid daybeds ${overview.unpaid}`,
      domain: 'revenue',
    });
  }
  if (force || overview.reserved > overview.checkedIn) {
    candidates.push({
      key: 'beachbeds_checkin_backlog',
      level: overview.reserved > overview.checkedIn ? 'info' : 'info',
      text: `Beachbed reservations ${overview.reserved} / checked-in ${overview.checkedIn}`,
      domain: 'checkin',
    });
  }
  if (force || overview.vipCabanas > 0) {
    candidates.push({
      key: 'beachbeds_vip_cabana',
      level: overview.vipCabanas > 0 ? 'warn' : 'info',
      text: `VIP cabanas ${overview.vipCabanas}`,
      domain: 'vip',
    });
  }
  for (const candidate of candidates) {
    const flag = addBeachbedsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `beachbeds sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bbs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('beachbeds-sweeps', sweep, 80);
  appendAudit({ actor, action: 'beachbeds.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: beachbedsSummary() };
}

export function ackBeachbedsFlag(input = {}, actor = 'system') {
  const list = readCollection('beachbeds-flags', []) || [];
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
  writeCollection('beachbeds-flags', list);
  appendAudit({ actor, action: 'beachbeds.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: beachbedsSummary() };
}

export function markBeachbedUnpaid(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.bedNo && x.bedNo === input.bedNo));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'reserved' || x.status === 'occupied');
  if (idx < 0) return { ok: false, error: 'Unpaid yapilacak daybed yok' };
  list[idx] = {
    ...list[idx],
    status: 'unpaid',
    paid: false,
    balanceDue: Number(input.balanceDue ?? input.amount ?? list[idx].balanceDue ?? 120) || 120,
    unpaidAt: input.unpaidAt || new Date().toISOString(),
    unpaidBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('beach-beds', list);
  appendAudit({ actor, action: 'beachbeds.unpaid_daybed', detail: list[idx].bedNo || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bed: list[idx], overview: beachbedsSummary() };
}

export function checkInBeachbed(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.bedNo && x.bedNo === input.bedNo));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'occupied');
  if (idx < 0) return { ok: false, error: 'Check-in yapilacak daybed yok' };
  list[idx] = {
    ...list[idx],
    status: 'occupied',
    guestName: input.guestName || list[idx].guestName,
    paid: input.paid !== undefined ? input.paid !== false : list[idx].paid,
    checkedInAt: input.checkedInAt || new Date().toISOString(),
    checkedInBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('beach-beds', list);
  appendAudit({ actor, action: 'beachbeds.checkin', detail: list[idx].bedNo || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bed: list[idx], overview: beachbedsSummary() };
}

export function seedVipCabana(input = {}, actor = 'system') {
  const bed = createBeachbeds(
    {
      bedNo: input.bedNo || `CAB-${randomBytes(1).toString('hex').toUpperCase()}`,
      guestName: input.guestName || 'VIP cabana guest',
      zone: input.zone || 'VIP cabana',
      status: input.status || 'reserved',
      vip: true,
      cabana: true,
      paid: input.paid !== undefined ? input.paid : true,
      balanceDue: Number(input.balanceDue ?? 0) || 0,
    },
    actor,
  );
  appendAudit({ actor, action: 'beachbeds.seed_vip_cabana', detail: bed.bedNo, meta: { id: bed.id } });
  return { ok: true, bed, overview: beachbedsSummary() };
}
