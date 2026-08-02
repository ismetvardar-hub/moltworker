/**
 * AŞAMA 46 — Fiziksel varlık / ekipman envanteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function isPast(iso) {
  const t = Date.parse(iso || 0);
  return Number.isFinite(t) && t < Date.now();
}

function daysOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 86400_000;
}

function ensureSeed() {
  let list = readCollection('assets', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'ast_gate_01',
        name: 'NEXUS Turnike #1',
        category: 'access',
        venueId: 'venue_olympos_beach',
        status: 'online',
        serial: 'NX-GATE-01',
        note: 'Ana giriş',
      },
      {
        id: 'ast_oven_01',
        name: 'Izgara ünitesi',
        category: 'kitchen',
        venueId: 'venue_kaleici',
        status: 'online',
        serial: 'KF-GRILL-2',
        note: '',
      },
      {
        id: 'ast_pos_01',
        name: 'POS terminal',
        category: 'pos',
        venueId: 'venue_olympos_beach',
        status: 'maintenance',
        serial: 'POS-17',
        note: 'Yazıcı değişimi bekliyor',
      },
    ];
    writeCollection('assets', list);
  }
  return list;
}

export function listAssets(filter = {}) {
  let list = ensureSeed();
  if (filter.venueId) list = list.filter((a) => a.venueId === filter.venueId);
  if (filter.status) list = list.filter((a) => a.status === filter.status);
  return list;
}

export function createAsset(input, actor = 'system') {
  const asset = {
    id: `ast_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'Varlık',
    category: input.category || 'general',
    venueId: input.venueId || null,
    status: input.status || 'online',
    serial: input.serial || '',
    note: input.note || '',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('assets', asset, 300);
  appendAudit({
    actor,
    action: 'assets.create',
    detail: asset.name,
    meta: { id: asset.id },
  });
  return asset;
}

export function updateAsset(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('assets', list);
  appendAudit({
    actor,
    action: 'assets.update',
    detail: `${list[idx].name} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function assetsSummary() {
  const list = listAssets();
  const flags = readCollection('assets-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const maintenanceDue = list.filter(
    (a) => a.status === 'maintenance' || isPast(a.maintenanceDueAt || a.nextMaintenanceAt) || daysOld(a.lastMaintainedAt || a.createdAt) >= 90,
  );
  const offline = list.filter((a) => a.status === 'offline');
  const missingAssignee = list.filter((a) => a.status !== 'retired' && !String(a.assignee || a.owner || '').trim());
  return {
    title: 'LİKYA Varlık Ops',
    total: list.length,
    online: list.filter((a) => a.status === 'online').length,
    maintenance: list.filter((a) => a.status === 'maintenance').length,
    maintenanceDue: maintenanceDue.length,
    offline: offline.length,
    missingAssignee: missingAssignee.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      online: list.filter((a) => a.status === 'online').length,
      maintenance: list.filter((a) => a.status === 'maintenance').length,
      maintenance_due: maintenanceDue.length,
      offline: offline.length,
      missing_assignee: missingAssignee.length,
    },
    summaryLines: [
      `Varlık ${list.length} · online ${list.filter((a) => a.status === 'online').length} · bakım ${list.filter((a) => a.status === 'maintenance').length}`,
      `Bakım due ${maintenanceDue.length} · offline ${offline.length} · assignee eksik ${missingAssignee.length}`,
    ],
  };
}

export function runAssetsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = assetsSummary();
  const existing = readCollection('assets-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.maintenanceDue || 0) > 0) {
    candidates.push({
      key: 'assets_maintenance_due',
      level: (overview.maintenanceDue || 0) > 0 ? 'warn' : 'info',
      text: `Bakımı gelen varlık ${overview.maintenanceDue || 0}`,
      domain: 'maintenance',
    });
  }
  if (force || (overview.offline || 0) > 0) {
    candidates.push({
      key: 'assets_offline',
      level: (overview.offline || 0) > 0 ? 'alert' : 'info',
      text: `Offline varlık ${overview.offline || 0}`,
      domain: 'availability',
    });
  }
  if (force || (overview.missingAssignee || 0) > 0) {
    candidates.push({
      key: 'assets_missing_assignee',
      level: (overview.missingAssignee || 0) > 0 ? 'warn' : 'info',
      text: `Sorumlusu eksik varlık ${overview.missingAssignee || 0}`,
      domain: 'ownership',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('astf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('assets-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `assets sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('asts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('assets-sweeps', sweep, 80);
  appendAudit({ actor, action: 'assets.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: assetsSummary() };
}

export function ackAssetsFlag(input = {}, actor = 'system') {
  const list = readCollection('assets-flags', []) || [];
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
  writeCollection('assets-flags', list);
  appendAudit({ actor, action: 'assets.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: assetsSummary() };
}

/** Mutator 1 — schedule or mark a real asset for maintenance. */
export function scheduleAssetMaintenance(input = {}, actor = 'system') {
  let row = null;
  if (input.id || input.assetId) row = ensureSeed().find((a) => a.id === (input.id || input.assetId));
  if (!row) row = listAssets().find((a) => a.status !== 'maintenance') || listAssets()[0];
  if (!row && input.seed !== false) row = createAsset({ name: 'Asset maintenance seed', category: 'ops' }, actor);
  if (!row) return { ok: false, error: 'Varlık bulunamadı' };
  const asset = updateAsset(
    row.id,
    {
      status: 'maintenance',
      assignee: input.assignee || row.assignee || 'HEPHAESTUS',
      maintenanceDueAt: input.maintenanceDueAt || new Date().toISOString(),
      note: input.note || row.note || 'ops maintenance scheduled',
    },
    actor,
  );
  appendAudit({ actor, action: 'assets.maintenance_schedule', detail: asset?.name || row.name, meta: { id: row.id } });
  return { ok: true, asset, scheduled: asset ? [asset.id] : [], overview: assetsSummary() };
}

/** Mutator 2 — restore an offline/maintenance asset to service. */
export function bringAssetOnline(input = {}, actor = 'system') {
  let row = null;
  if (input.id || input.assetId) row = ensureSeed().find((a) => a.id === (input.id || input.assetId));
  if (!row) row = listAssets().find((a) => a.status === 'offline') || listAssets().find((a) => a.status === 'maintenance') || listAssets()[0];
  if (!row && input.seed !== false) row = createAsset({ name: 'Offline asset seed', status: 'offline', category: 'ops' }, actor);
  if (!row) return { ok: false, error: 'Varlık bulunamadı' };
  const asset = updateAsset(
    row.id,
    {
      status: 'online',
      assignee: input.assignee || row.assignee || 'Ops owner',
      lastMaintainedAt: new Date().toISOString(),
      maintenanceDueAt: input.nextMaintenanceAt || new Date(Date.now() + 30 * 86400_000).toISOString(),
      note: input.note || row.note || 'ops online',
    },
    actor,
  );
  appendAudit({ actor, action: 'assets.online', detail: asset?.name || row.name, meta: { id: row.id } });
  return { ok: true, asset, online: asset ? [asset.id] : [], overview: assetsSummary() };
}

/** Mutator 3 — assign ownership to assets missing an assignee. */
export function assignAssetOwner(input = {}, actor = 'system') {
  let rows = listAssets().filter((a) => a.status !== 'retired' && !String(a.assignee || a.owner || '').trim());
  if (input.id || input.assetId) rows = ensureSeed().filter((a) => a.id === (input.id || input.assetId));
  if (!rows.length && input.seed !== false) rows = [createAsset({ name: 'Unassigned asset seed', category: 'ops' }, actor)];
  const assigned = [];
  let asset = null;
  for (const row of rows.slice(0, Number(input.limit) || 10)) {
    const next = updateAsset(
      row.id,
      {
        assignee: input.assignee || 'Ops owner',
        owner: input.owner || input.assignee || row.owner || 'Ops owner',
        assignedAt: new Date().toISOString(),
      },
      actor,
    );
    if (next) {
      asset = next;
      assigned.push(next.id);
    }
  }
  appendAudit({ actor, action: 'assets.assign_owner', detail: `${assigned.length}`, meta: { n: assigned.length } });
  return { ok: true, asset, assigned, overview: assetsSummary() };
}
