/**
 * Wave 173 - Bakery dough and bake ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('bakery', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bky_1',
      item: 'Cheesecake',
      qty: 1,
      status: 'ordered',
      at: new Date().toISOString(),
    }];
    writeCollection('bakery', seed);
    return seed;
  }
  return list;
}

function openBakeryFlags() {
  const flags = readCollection('bakery-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBakeryFlag(candidate, actor = 'system') {
  const existing = readCollection('bakery-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('bkf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('bakery-flags', list.slice(0, 200));
  return flag;
}

function isDoughLag(row) {
  return row.doughLag === true || row.status === 'lagging' || Number(row.lagMinutes ?? 0) >= 20;
}

export function listBakery(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBakery(input = {}, actor = 'system') {
  const row = {
    id: rid('bky'),
    item: input.item !== undefined ? input.item : 'Cheesecake',
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 1,
    status: input.status || 'ordered',
    oven: input.oven !== undefined ? input.oven : undefined,
    batch: input.batch !== undefined ? input.batch : undefined,
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bakery', row, 300);
  appendAudit({
    actor,
    action: 'bakery.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBakery(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  if (next.lagMinutes !== undefined) next.lagMinutes = Number(next.lagMinutes) || 0;
  list[idx] = next;
  writeCollection('bakery', list);
  appendAudit({ actor, action: 'bakery.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function bakerySummary() {
  const list = listBakery();
  const doughLag = list.filter(isDoughLag);
  const dawnBatches = list.filter((x) => x.dawnBatch === true || x.batchType === 'dawn');
  const flags = openBakeryFlags();
  return {
    title: 'LIKYA Bakery Ops',
    total: list.length,
    ordered: list.filter((x) => x.status === 'ordered').length,
    ready: list.filter((x) => x.status === 'ready').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    lagging: list.filter((x) => x.status === 'lagging').length,
    doughLag: doughLag.length,
    dawnBatches: dawnBatches.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ordered: list.filter((x) => x.status === 'ordered').length,
      ready: list.filter((x) => x.status === 'ready').length,
      delivered: list.filter((x) => x.status === 'delivered').length,
      dough_lag: doughLag.length,
      dawn_batches: dawnBatches.length,
    },
    summaryLines: [
      `Bakery ${list.length} batch - dough lag ${doughLag.length} - ready ${list.filter((x) => x.status === 'ready').length}`,
      `Dawn batch ${dawnBatches.length} - delivered ${list.filter((x) => x.status === 'delivered').length} - flag ${flags.length}`,
    ],
    bakery: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBakerySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = bakerySummary();
  const created = [];
  const candidates = [];
  if (force || overview.doughLag > 0) {
    candidates.push({
      key: 'bakery_dough_lag',
      level: overview.doughLag > 0 ? 'warn' : 'info',
      text: `Bakery dough lag batches ${overview.doughLag}`,
      domain: 'dough',
    });
  }
  if (force || overview.ready > 0) {
    candidates.push({
      key: 'bakery_release_bake_flow',
      level: 'info',
      text: `Bakery ready bakes ${overview.ready}`,
      domain: 'release',
    });
  }
  if (force || overview.dawnBatches > 0) {
    candidates.push({
      key: 'bakery_dawn_batch',
      level: 'info',
      text: `Bakery dawn batches ${overview.dawnBatches}`,
      domain: 'dawn',
    });
  }
  for (const candidate of candidates) {
    const flag = addBakeryFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `bakery sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bks'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bakery-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bakery.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: bakerySummary() };
}

export function ackBakeryFlag(input = {}, actor = 'system') {
  const list = readCollection('bakery-flags', []) || [];
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
  writeCollection('bakery-flags', list);
  appendAudit({ actor, action: 'bakery.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: bakerySummary() };
}

export function markBakeryDoughLag(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.item && x.item === input.item));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'lagging');
  if (idx < 0) return { ok: false, error: 'Dough lag yapilacak bakery batch yok' };
  list[idx] = {
    ...list[idx],
    status: 'lagging',
    lagMinutes: Number(input.lagMinutes ?? 35) || 35,
    doughLag: true,
    lagReason: input.reason || input.lagReason || 'proofing_delay',
    laggedAt: input.laggedAt || new Date().toISOString(),
    laggedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bakery', list);
  appendAudit({ actor, action: 'bakery.dough_lag', detail: list[idx].item || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bake: list[idx], overview: bakerySummary() };
}

export function releaseBakeryBake(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.item && x.item === input.item));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isDoughLag);
  if (idx < 0) return { ok: false, error: 'Release edilecek bakery batch yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'ready',
    doughLag: false,
    lagMinutes: 0,
    releasedAt: input.releasedAt || new Date().toISOString(),
    releasedBy: actor,
    oven: input.oven || list[idx].oven || 'Deck 1',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('bakery', list);
  appendAudit({ actor, action: 'bakery.release_bake', detail: list[idx].item || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bake: list[idx], overview: bakerySummary() };
}

export function seedDawnBatch(input = {}, actor = 'system') {
  const bake = createBakery(
    {
      item: input.item || 'Dawn sourdough',
      qty: Number(input.qty ?? 24) || 24,
      status: input.status || 'ordered',
      batch: input.batch || 'dawn',
      oven: input.oven || 'Deck 2',
    },
    actor,
  );
  const patched = updateBakery(
    bake.id,
    {
      dawnBatch: true,
      batchType: 'dawn',
      doughLag: true,
      lagMinutes: Number(input.lagMinutes ?? 25) || 25,
      source: 'wave173',
    },
    actor,
  );
  appendAudit({ actor, action: 'bakery.seed_dawn_batch', detail: patched?.item || bake.item, meta: { id: bake.id } });
  return { ok: true, bake: patched || bake, overview: bakerySummary() };
}
