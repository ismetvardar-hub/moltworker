import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 178 - Media kit asset ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('media-kit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'med_1',
      title: "Kit öğesi",
      channel: "press",
      status: 'draft',
      at: new Date().toISOString(),
    }];
    writeCollection('media-kit', seed);
    return seed;
  }
  return list;
}

function openMediakitFlags() {
  const flags = readCollection('mediakit-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMediakitFlag(candidate, actor = 'system') {
  const existing = readCollection('mediakit-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('medf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('mediakit-flags', list.slice(0, 200));
  return flag;
}

function isOutdatedAsset(row) {
  if (row.outdatedAsset === true || row.status === 'outdated') return true;
  const reviewed = Date.parse(row.reviewedAt || row.updatedAt || row.at || '');
  return Number.isFinite(reviewed) && reviewed < Date.now() - 90 * 24 * 60 * 60_000;
}

function isPublishedKit(row) {
  return row.published === true || row.status === 'published' || Boolean(row.publishedAt);
}

function isPressDrop(row) {
  return row.pressDrop === true || row.dropType === 'press';
}

export function listMediakit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createMediakit(input = {}, actor = 'system') {
  const row = {
    id: rid('med'),
    title: input.title !== undefined ? input.title : "Kit öğesi",
    channel: input.channel !== undefined ? input.channel : "press",
    assetType: input.assetType !== undefined ? input.assetType : undefined,
    dropType: input.dropType !== undefined ? input.dropType : undefined,
    pressDrop: input.pressDrop === true || undefined,
    status: input.status || 'draft',
    reviewedAt: input.reviewedAt !== undefined ? input.reviewedAt : undefined,
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('media-kit', row, 300);
  appendAudit({
    actor,
    action: 'mediakit.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMediakit(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('media-kit', list);
  appendAudit({ actor, action: 'mediakit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function mediakitSummary() {
  const list = listMediakit();
  const outdatedAssets = list.filter(isOutdatedAsset);
  const publishedKits = list.filter(isPublishedKit);
  const pressDrops = list.filter(isPressDrop);
  const flags = openMediakitFlags();
  return {
    title: 'LIKYA Media Kit Ops',
    total: list.length,
    draft: list.filter((x) => x.status === 'draft').length,
    ready: list.filter((x) => x.status === 'ready').length,
    published: list.filter((x) => x.status === 'published').length,
    outdatedAssets: outdatedAssets.length,
    publishedKits: publishedKits.length,
    pressDrops: pressDrops.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      draft: list.filter((x) => x.status === 'draft').length,
      ready: list.filter((x) => x.status === 'ready').length,
      published: list.filter((x) => x.status === 'published').length,
      outdated_assets: outdatedAssets.length,
      published_kits: publishedKits.length,
      press_drops: pressDrops.length,
    },
    summaryLines: [
      `Media kit ${list.length} asset - outdated ${outdatedAssets.length} - published ${publishedKits.length}`,
      `Draft ${list.filter((x) => x.status === 'draft').length} - press drops ${pressDrops.length} - flag ${flags.length}`,
    ],
    assets: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runMediakitSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = mediakitSummary();
  const created = [];
  const candidates = [];
  if (force || overview.outdatedAssets > 0) {
    candidates.push({
      key: 'mediakit_outdated_asset',
      level: overview.outdatedAssets > 0 ? 'warn' : 'info',
      text: `Media kit outdated assets ${overview.outdatedAssets}`,
      domain: 'asset',
    });
  }
  if (force || overview.publishedKits === 0) {
    candidates.push({
      key: 'mediakit_publish_needed',
      level: overview.publishedKits === 0 ? 'warn' : 'info',
      text: `Media kit published kits ${overview.publishedKits}`,
      domain: 'publish',
    });
  }
  if (force || overview.pressDrops === 0) {
    candidates.push({
      key: 'mediakit_press_drop_seed',
      level: 'info',
      text: `Media kit press drops ${overview.pressDrops}`,
      domain: 'press',
    });
  }
  for (const candidate of candidates) {
    const flag = addMediakitFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `mediakit sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('meds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('mediakit-sweeps', sweep, 80);
  appendAudit({ actor, action: 'mediakit.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: mediakitSummary() };
}

export function ackMediakitFlag(input = {}, actor = 'system') {
  const list = readCollection('mediakit-flags', []) || [];
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
  writeCollection('mediakit-flags', list);
  appendAudit({ actor, action: 'mediakit.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: mediakitSummary() };
}

export function markMediakitOutdatedAsset(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.title && x.title === input.title));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isOutdatedAsset(x));
  if (idx < 0) return { ok: false, error: 'Outdated yapilacak mediakit asset yok' };
  list[idx] = {
    ...list[idx],
    status: 'outdated',
    outdatedAsset: true,
    reviewedAt: input.reviewedAt || new Date(Date.now() - 120 * 24 * 60 * 60_000).toISOString(),
    outdatedReason: input.reason || input.outdatedReason || 'asset_refresh_due',
    outdatedAt: input.outdatedAt || new Date().toISOString(),
    outdatedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('media-kit', list);
  appendAudit({ actor, action: 'mediakit.outdated_asset', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, asset: list[idx], overview: mediakitSummary() };
}

export function publishMediakitKit(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.title && x.title === input.title));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'ready' || x.status === 'draft' || isOutdatedAsset(x));
  if (idx < 0) return { ok: false, error: 'Publish edilecek mediakit yok' };
  list[idx] = {
    ...list[idx],
    status: 'published',
    outdatedAsset: false,
    published: true,
    channel: input.channel || list[idx].channel || 'press',
    publishedAt: input.publishedAt || new Date().toISOString(),
    publishedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('media-kit', list);
  appendAudit({ actor, action: 'mediakit.publish', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, asset: list[idx], overview: mediakitSummary() };
}

export function seedPressDrop(input = {}, actor = 'system') {
  const asset = createMediakit(
    {
      title: input.title || 'Wave 178 Press Drop',
      channel: input.channel || 'press',
      assetType: input.assetType || 'press-kit',
      dropType: 'press',
      pressDrop: true,
      status: input.status || 'ready',
      reviewedAt: input.reviewedAt || new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'mediakit.seed_press_drop', detail: asset.title, meta: { id: asset.id } });
  return { ok: true, asset, overview: mediakitSummary() };
}
