/**
 * Wave 176 - Wristband day-pass ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('bands', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bnd_1',
      code: "B-100",
      guestName: "Misafir",
      status: 'issued',
      at: new Date().toISOString(),
    }];
    writeCollection('bands', seed);
    return seed;
  }
  return list;
}

function openBandsFlags() {
  const flags = readCollection('bands-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBandsFlag(candidate, actor = 'system') {
  const existing = readCollection('bands-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bnf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('bands-flags', list.slice(0, 200));
  return flag;
}

function isWristbandMismatch(row) {
  return row.wristbandMismatch === true || row.status === 'mismatch' || row.status === 'wristband_mismatch';
}

function isReissuedBand(row) {
  return row.reissued === true || row.status === 'reissued' || Boolean(row.reissuedAt);
}

function isDayPassBand(row) {
  return row.dayPass === true || row.passType === 'day_pass';
}

export function listBands(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBands(input = {}, actor = 'system') {
  const row = {
    id: rid('bnd'),
    code: input.code !== undefined ? input.code : "B-100",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    passType: input.passType !== undefined ? input.passType : undefined,
    validUntil: input.validUntil !== undefined ? input.validUntil : undefined,
    dayPass: input.dayPass === true || undefined,
    status: input.status || 'issued',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bands', row, 300);
  appendAudit({
    actor,
    action: 'bands.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBands(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bands', list);
  appendAudit({ actor, action: 'bands.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function bandsSummary() {
  const list = listBands();
  const mismatches = list.filter(isWristbandMismatch);
  const reissued = list.filter(isReissuedBand);
  const dayPassBands = list.filter(isDayPassBand);
  const flags = openBandsFlags();
  return {
    title: 'LIKYA Wristband Ops',
    total: list.length,
    issued: list.filter((x) => x.status === 'issued').length,
    active: list.filter((x) => x.status === 'active').length,
    returned: list.filter((x) => x.status === 'returned').length,
    mismatches: mismatches.length,
    reissued: reissued.length,
    dayPassBands: dayPassBands.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      issued: list.filter((x) => x.status === 'issued').length,
      active: list.filter((x) => x.status === 'active').length,
      returned: list.filter((x) => x.status === 'returned').length,
      mismatches: mismatches.length,
      reissued: reissued.length,
      day_pass_bands: dayPassBands.length,
    },
    summaryLines: [
      `Bands ${list.length} wristband - mismatch ${mismatches.length} - reissued ${reissued.length}`,
      `Issued ${list.filter((x) => x.status === 'issued').length} - day pass ${dayPassBands.length} - flag ${flags.length}`,
    ],
    bands: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBandsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = bandsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.mismatches > 0) {
    candidates.push({
      key: 'bands_wristband_mismatch',
      level: overview.mismatches > 0 ? 'warn' : 'info',
      text: `Band wristband mismatches ${overview.mismatches}`,
      domain: 'mismatch',
    });
  }
  if (force || overview.reissued === 0) {
    candidates.push({
      key: 'bands_reissue_needed',
      level: overview.reissued === 0 ? 'warn' : 'info',
      text: `Band reissued rows ${overview.reissued}`,
      domain: 'reissue',
    });
  }
  if (force || overview.dayPassBands === 0) {
    candidates.push({
      key: 'bands_day_pass_seed',
      level: 'info',
      text: `Band day-pass rows ${overview.dayPassBands}`,
      domain: 'day_pass',
    });
  }
  for (const candidate of candidates) {
    const flag = addBandsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `bands sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bands-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bands.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: bandsSummary() };
}

export function ackBandsFlag(input = {}, actor = 'system') {
  const list = readCollection('bands-flags', []) || [];
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
  writeCollection('bands-flags', list);
  appendAudit({ actor, action: 'bands.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: bandsSummary() };
}

export function markBandsWristbandMismatch(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isWristbandMismatch(x));
  if (idx < 0) return { ok: false, error: 'Mismatch yapilacak band yok' };
  list[idx] = {
    ...list[idx],
    status: 'wristband_mismatch',
    wristbandMismatch: true,
    mismatchCode: input.mismatchCode || input.scannedCode || `${list[idx].code || 'B'}-MISMATCH`,
    mismatchReason: input.reason || input.mismatchReason || 'guest_code_scan_mismatch',
    mismatchAt: input.mismatchAt || new Date().toISOString(),
    mismatchBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bands', list);
  appendAudit({ actor, action: 'bands.wristband_mismatch', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, band: list[idx], overview: bandsSummary() };
}

export function reissueBand(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isWristbandMismatch(x) || x.status === 'issued' || x.status === 'active');
  if (idx < 0) {
    const band = createBands({
      code: input.newCode || input.code || 'B-176-R',
      guestName: input.guestName || 'Wave 176 Reissue',
      status: 'reissued',
    }, actor);
    return { ok: true, band, overview: bandsSummary() };
  }
  const oldCode = list[idx].code;
  list[idx] = {
    ...list[idx],
    status: 'reissued',
    code: input.newCode || list[idx].code,
    previousCode: input.previousCode || oldCode,
    reissued: true,
    wristbandMismatch: false,
    reissueReason: input.reason || input.reissueReason || 'mismatch_replaced',
    reissuedAt: input.reissuedAt || new Date().toISOString(),
    reissuedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bands', list);
  appendAudit({ actor, action: 'bands.reissue', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, band: list[idx], overview: bandsSummary() };
}

export function seedDayPassBand(input = {}, actor = 'system') {
  const band = createBands(
    {
      code: input.code || `DAY-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      guestName: input.guestName || 'Wave 176 Day Pass',
      passType: 'day_pass',
      dayPass: true,
      validUntil: input.validUntil || new Date(Date.now() + 12 * 60 * 60_000).toISOString(),
      status: input.status || 'issued',
    },
    actor,
  );
  appendAudit({ actor, action: 'bands.seed_day_pass', detail: band.code, meta: { id: band.id } });
  return { ok: true, band, overview: bandsSummary() };
}
