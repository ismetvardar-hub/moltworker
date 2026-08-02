/**
 * Wave 172 - Late checkout ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('lateout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'lco_1',
      room: '204',
      until: '14:00',
      status: 'requested',
      at: new Date().toISOString(),
    }];
    writeCollection('lateout', seed);
    return seed;
  }
  return list;
}

function openLateoutFlags() {
  const flags = readCollection('lateout-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addLateoutFlag(candidate, actor = 'system') {
  const existing = readCollection('lateout-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('lcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('lateout-flags', list.slice(0, 200));
  return flag;
}

function isUnpaidFee(row) {
  return row.unpaidFee === true || row.feeStatus === 'unpaid' || row.status === 'fee_unpaid';
}

export function listLateout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createLateout(input = {}, actor = 'system') {
  const row = {
    id: rid('lco'),
    room: input.room !== undefined ? input.room : '204',
    guestName: input.guestName !== undefined ? input.guestName : undefined,
    until: input.until !== undefined ? input.until : '14:00',
    fee: input.fee !== undefined ? Number(input.fee) || 0 : undefined,
    status: input.status || 'requested',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lateout', row, 300);
  appendAudit({
    actor,
    action: 'lateout.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateLateout(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.fee !== undefined) next.fee = Number(next.fee) || 0;
  list[idx] = next;
  writeCollection('lateout', list);
  appendAudit({ actor, action: 'lateout.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function lateoutSummary() {
  const list = listLateout();
  const unpaidFees = list.filter(isUnpaidFee);
  const vipLateouts = list.filter((x) => x.vip === true || x.tier === 'vip');
  const flags = openLateoutFlags();
  return {
    title: 'LIKYA Late Checkout Ops',
    total: list.length,
    requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length,
    unpaidFees: unpaidFees.length,
    vipLateouts: vipLateouts.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      requested: list.filter((x) => x.status === 'requested').length,
      approved: list.filter((x) => x.status === 'approved').length,
      denied: list.filter((x) => x.status === 'denied').length,
      unpaid_fees: unpaidFees.length,
      vip_lateouts: vipLateouts.length,
    },
    summaryLines: [
      `Late checkout ${list.length} request - unpaid fee ${unpaidFees.length} - approved ${list.filter((x) => x.status === 'approved').length}`,
      `VIP late out ${vipLateouts.length} - requested ${list.filter((x) => x.status === 'requested').length} - flag ${flags.length}`,
    ],
    lateout: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runLateoutSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = lateoutSummary();
  const created = [];
  const candidates = [];
  if (force || overview.unpaidFees > 0) {
    candidates.push({
      key: 'lateout_unpaid_fee',
      level: overview.unpaidFees > 0 ? 'warn' : 'info',
      text: `Late out unpaid fees ${overview.unpaidFees}`,
      domain: 'fee',
    });
  }
  if (force || overview.approved > 0) {
    candidates.push({
      key: 'lateout_extension_approval',
      level: 'info',
      text: `Late out approved extensions ${overview.approved}`,
      domain: 'extension',
    });
  }
  if (force || overview.vipLateouts > 0) {
    candidates.push({
      key: 'lateout_vip_seed',
      level: 'info',
      text: `VIP late outs ${overview.vipLateouts}`,
      domain: 'vip',
    });
  }
  for (const candidate of candidates) {
    const flag = addLateoutFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `lateout sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('lcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('lateout-sweeps', sweep, 80);
  appendAudit({ actor, action: 'lateout.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: lateoutSummary() };
}

export function ackLateoutFlag(input = {}, actor = 'system') {
  const list = readCollection('lateout-flags', []) || [];
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
  writeCollection('lateout-flags', list);
  appendAudit({ actor, action: 'lateout.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: lateoutSummary() };
}

export function markLateoutUnpaidFee(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'requested' || x.status === 'approved');
  if (idx < 0) return { ok: false, error: 'Unpaid fee icin lateout yok' };
  list[idx] = {
    ...list[idx],
    unpaidFee: true,
    feeStatus: 'unpaid',
    fee: Number(input.fee ?? list[idx].fee ?? 35) || 35,
    feeMarkedAt: input.feeMarkedAt || new Date().toISOString(),
    feeMarkedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('lateout', list);
  appendAudit({ actor, action: 'lateout.unpaid_fee', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, lateout: list[idx], overview: lateoutSummary() };
}

export function approveLateoutExtension(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'approved');
  if (idx < 0) return { ok: false, error: 'Approve edilecek lateout yok' };
  list[idx] = {
    ...list[idx],
    status: 'approved',
    until: input.until || input.approvedUntil || list[idx].until || '15:00',
    approvedUntil: input.approvedUntil || input.until || list[idx].until || '15:00',
    approvedAt: input.approvedAt || new Date().toISOString(),
    approvedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('lateout', list);
  appendAudit({ actor, action: 'lateout.extension_approve', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, lateout: list[idx], overview: lateoutSummary() };
}

export function seedVipLateOut(input = {}, actor = 'system') {
  const lateout = createLateout(
    {
      room: input.room || '701',
      guestName: input.guestName || 'VIP Guest',
      until: input.until || '16:00',
      fee: Number(input.fee ?? 0) || 0,
      status: input.status || 'requested',
    },
    actor,
  );
  const patched = updateLateout(
    lateout.id,
    {
      vip: true,
      tier: 'vip',
      note: input.note || 'VIP late checkout watch',
      source: 'wave172',
    },
    actor,
  );
  appendAudit({ actor, action: 'lateout.seed_vip', detail: patched?.room || lateout.room, meta: { id: lateout.id } });
  return { ok: true, lateout: patched || lateout, overview: lateoutSummary() };
}
