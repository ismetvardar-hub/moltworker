import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 169 - QR check-in scan ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('qrcheckin', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'qrc_1',
      guestName: "Misafir",
      code: "QR-100",
      status: 'pending',
      invalidScans: 0,
      at: new Date().toISOString(),
    }];
    writeCollection('qrcheckin', seed);
    return seed;
  }
  return list;
}

function openQrcheckinFlags() {
  const flags = readCollection('qrcheckin-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addQrcheckinFlag(candidate, actor = 'system') {
  const existing = readCollection('qrcheckin-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('qrf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('qrcheckin-flags', list.slice(0, 200));
  return flag;
}

function hasInvalidScanSpike(row) {
  return row.status === 'invalid_spike' || row.invalidScanSpike === true || Number(row.invalidScans || 0) >= 3;
}

export function listQrcheckin(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createQrcheckin(input = {}, actor = 'system') {
  const row = {
    id: rid('qrc'),
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    code: input.code !== undefined ? input.code : "QR-100",
    room: input.room || null,
    tier: input.tier || null,
    invalidScans: Number(input.invalidScans ?? 0) || 0,
    expiresAt: input.expiresAt || null,
    status: input.status || 'pending',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('qrcheckin', row, 300);
  appendAudit({
    actor,
    action: 'qrcheckin.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateQrcheckin(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.invalidScans !== undefined) next.invalidScans = Number(next.invalidScans) || 0;
  list[idx] = next;
  writeCollection('qrcheckin', list);
  appendAudit({ actor, action: 'qrcheckin.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function qrcheckinSummary() {
  const list = listQrcheckin();
  const invalidSpikes = list.filter(hasInvalidScanSpike);
  const admitted = list.filter((x) => x.status === 'admitted' || x.status === 'checked_in' || x.admittedAt);
  const vipQr = list.filter((x) => x.vipQr === true || x.tier === 'vip');
  const flags = openQrcheckinFlags();
  return {
    title: 'LIKYA QR Check-in Ops',
    total: list.length,
    pending: list.filter((x) => x.status === 'pending').length,
    checked_in: list.filter((x) => x.status === 'checked_in').length,
    admitted: admitted.length,
    expired: list.filter((x) => x.status === 'expired').length,
    invalidSpikes: invalidSpikes.length,
    vipQr: vipQr.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      pending: list.filter((x) => x.status === 'pending').length,
      checked_in: list.filter((x) => x.status === 'checked_in').length,
      admitted: admitted.length,
      expired: list.filter((x) => x.status === 'expired').length,
      invalid_spikes: invalidSpikes.length,
      vip_qr: vipQr.length,
    },
    summaryLines: [
      `QR check-in ${list.length} code - pending ${list.filter((x) => x.status === 'pending').length} - admitted ${admitted.length}`,
      `Invalid scan spikes ${invalidSpikes.length} - VIP QR ${vipQr.length} - flag ${flags.length}`,
    ],
    qrcheckin: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runQrcheckinSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = qrcheckinSummary();
  const created = [];
  const candidates = [];
  if (force || overview.invalidSpikes > 0) {
    candidates.push({
      key: 'qrcheckin_invalid_scan_spike',
      level: overview.invalidSpikes > 0 ? 'alert' : 'info',
      text: `QR invalid scan spikes ${overview.invalidSpikes}`,
      domain: 'scan',
    });
  }
  if (force || overview.pending > 0) {
    candidates.push({
      key: 'qrcheckin_admit_queue',
      level: overview.pending > 0 ? 'info' : 'info',
      text: `QR admit queue ${overview.pending}`,
      domain: 'admit',
    });
  }
  if (force || overview.vipQr > 0) {
    candidates.push({
      key: 'qrcheckin_vip_qr',
      level: overview.vipQr > 0 ? 'warn' : 'info',
      text: `VIP QR check-ins ${overview.vipQr}`,
      domain: 'vip',
    });
  }
  for (const candidate of candidates) {
    const flag = addQrcheckinFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `qrcheckin sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('qrs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('qrcheckin-sweeps', sweep, 80);
  appendAudit({ actor, action: 'qrcheckin.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: qrcheckinSummary() };
}

export function ackQrcheckinFlag(input = {}, actor = 'system') {
  const list = readCollection('qrcheckin-flags', []) || [];
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
  writeCollection('qrcheckin-flags', list);
  appendAudit({ actor, action: 'qrcheckin.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: qrcheckinSummary() };
}

export function markQrcheckinInvalidScanSpike(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'pending' || x.status === 'expired');
  if (idx < 0) return { ok: false, error: 'Invalid scan spike yapilacak QR yok' };
  list[idx] = {
    ...list[idx],
    status: 'invalid_spike',
    invalidScanSpike: true,
    invalidScans: Number(input.invalidScans ?? list[idx].invalidScans ?? 5) || 5,
    invalidScanAt: input.invalidScanAt || new Date().toISOString(),
    invalidScanBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('qrcheckin', list);
  appendAudit({ actor, action: 'qrcheckin.invalid_scan_spike', detail: list[idx].code || list[idx].guestName, meta: { id: list[idx].id } });
  return { ok: true, qrcheckin: list[idx], overview: qrcheckinSummary() };
}

export function admitQrcheckinGuest(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'pending' || x.status === 'invalid_spike');
  if (idx < 0) return { ok: false, error: 'Admit edilecek QR guest yok' };
  list[idx] = {
    ...list[idx],
    status: 'admitted',
    admittedAt: input.admittedAt || new Date().toISOString(),
    admittedBy: actor,
    gate: input.gate || list[idx].gate || 'Lobby',
    invalidScanSpike: false,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('qrcheckin', list);
  appendAudit({ actor, action: 'qrcheckin.admit_guest', detail: list[idx].guestName || list[idx].code, meta: { id: list[idx].id } });
  return { ok: true, qrcheckin: list[idx], overview: qrcheckinSummary() };
}

export function seedVipQr(input = {}, actor = 'system') {
  const qrcheckin = createQrcheckin(
    {
      guestName: input.guestName || 'VIP QR guest',
      code: input.code || `VIP-${randomBytes(2).toString('hex').toUpperCase()}`,
      room: input.room || 'VIP',
      tier: 'vip',
      expiresAt: input.expiresAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      status: input.status || 'pending',
    },
    actor,
  );
  updateQrcheckin(qrcheckin.id, { vipQr: true, priorityLane: input.priorityLane || 'lobby' }, actor);
  appendAudit({ actor, action: 'qrcheckin.seed_vip_qr', detail: qrcheckin.code, meta: { id: qrcheckin.id } });
  return {
    ok: true,
    qrcheckin: { ...qrcheckin, vipQr: true, priorityLane: input.priorityLane || 'lobby' },
    overview: qrcheckinSummary(),
  };
}
