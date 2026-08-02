/**
 * Wave 171 - Amenity request ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('amenities', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'amn_1',
      room: '101',
      item: 'Meyve tabagi',
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('amenities', seed);
    return seed;
  }
  return list;
}

function openAmenitiesFlags() {
  const flags = readCollection('amenities-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addAmenitiesFlag(candidate, actor = 'system') {
  const existing = readCollection('amenities-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('amf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('amenities-flags', list.slice(0, 200));
  return flag;
}

function isRequestBacklog(row) {
  if (row.status === 'backlog' || row.requestBacklog === true) return true;
  const at = Date.parse(row.requestedAt || row.at || '');
  return row.status === 'queued' && Number.isFinite(at) && at < Date.now() - 45 * 60_000;
}

export function listAmenities(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createAmenities(input = {}, actor = 'system') {
  const row = {
    id: rid('amn'),
    room: input.room !== undefined ? input.room : '101',
    item: input.item !== undefined ? input.item : 'Meyve tabagi',
    status: input.status || 'queued',
    requestedAt: input.requestedAt || new Date().toISOString(),
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('amenities', row, 300);
  appendAudit({
    actor,
    action: 'amenities.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateAmenities(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('amenities', list);
  appendAudit({ actor, action: 'amenities.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function amenitiesSummary() {
  const list = listAmenities();
  const backlog = list.filter(isRequestBacklog);
  const pillowMenus = list.filter((x) => x.pillowMenu === true || x.menuType === 'pillow');
  const flags = openAmenitiesFlags();
  return {
    title: 'LIKYA Amenities Ops',
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    skipped: list.filter((x) => x.status === 'skipped').length,
    backlog: backlog.length,
    pillowMenus: pillowMenus.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      queued: list.filter((x) => x.status === 'queued').length,
      delivered: list.filter((x) => x.status === 'delivered').length,
      skipped: list.filter((x) => x.status === 'skipped').length,
      backlog: backlog.length,
      pillow_menus: pillowMenus.length,
    },
    summaryLines: [
      `Amenities ${list.length} request - backlog ${backlog.length} - queued ${list.filter((x) => x.status === 'queued').length}`,
      `Pillow menus ${pillowMenus.length} - delivered ${list.filter((x) => x.status === 'delivered').length} - flag ${flags.length}`,
    ],
    amenities: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runAmenitiesSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = amenitiesSummary();
  const created = [];
  const candidates = [];
  if (force || overview.backlog > 0) {
    candidates.push({
      key: 'amenities_request_backlog',
      level: overview.backlog > 0 ? 'warn' : 'info',
      text: `Amenity request backlog ${overview.backlog}`,
      domain: 'request',
    });
  }
  if (force || overview.delivered > 0) {
    candidates.push({
      key: 'amenities_fulfillment_flow',
      level: 'info',
      text: `Amenity fulfilled ${overview.delivered}`,
      domain: 'fulfill',
    });
  }
  if (force || overview.pillowMenus > 0) {
    candidates.push({
      key: 'amenities_pillow_menu',
      level: 'info',
      text: `Pillow menus ${overview.pillowMenus}`,
      domain: 'pillow',
    });
  }
  for (const candidate of candidates) {
    const flag = addAmenitiesFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `amenities sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('ams'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('amenities-sweeps', sweep, 80);
  appendAudit({ actor, action: 'amenities.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: amenitiesSummary() };
}

export function ackAmenitiesFlag(input = {}, actor = 'system') {
  const list = readCollection('amenities-flags', []) || [];
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
  writeCollection('amenities-flags', list);
  appendAudit({ actor, action: 'amenities.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: amenitiesSummary() };
}

export function markAmenitiesRequestBacklog(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'queued');
  if (idx < 0) return { ok: false, error: 'Backlog yapilacak amenity yok' };
  list[idx] = {
    ...list[idx],
    status: 'backlog',
    requestBacklog: true,
    requestedAt: input.requestedAt || new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    backlogAt: input.backlogAt || new Date().toISOString(),
    backlogBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('amenities', list);
  appendAudit({ actor, action: 'amenities.request_backlog', detail: list[idx].room || list[idx].item, meta: { id: list[idx].id } });
  return { ok: true, amenity: list[idx], overview: amenitiesSummary() };
}

export function fulfillAmenitiesRequest(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'delivered');
  if (idx < 0) return { ok: false, error: 'Fulfill edilecek amenity yok' };
  list[idx] = {
    ...list[idx],
    status: 'delivered',
    requestBacklog: false,
    fulfilledAt: input.fulfilledAt || new Date().toISOString(),
    fulfilledBy: actor,
    note: input.note || list[idx].note || 'Fulfilled',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('amenities', list);
  appendAudit({ actor, action: 'amenities.fulfill', detail: list[idx].room || list[idx].item, meta: { id: list[idx].id } });
  return { ok: true, amenity: list[idx], overview: amenitiesSummary() };
}

export function seedPillowMenu(input = {}, actor = 'system') {
  const amenity = createAmenities(
    {
      room: input.room || '101',
      item: input.item || input.pillow || 'Pillow menu',
      status: input.status || 'queued',
      requestedAt: input.requestedAt || new Date().toISOString(),
    },
    actor,
  );
  const patched = updateAmenities(
    amenity.id,
    {
      pillowMenu: true,
      menuType: 'pillow',
      pillow: input.pillow || input.item || 'Orthopedic pillow',
      options: input.options || ['soft', 'orthopedic', 'lavender'],
    },
    actor,
  );
  appendAudit({ actor, action: 'amenities.seed_pillow_menu', detail: patched?.pillow || amenity.item, meta: { id: amenity.id } });
  return { ok: true, amenity: patched || amenity, overview: amenitiesSummary() };
}
