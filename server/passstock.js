/**
 * Wave 171 - Pass / wristband stock ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('pass-stock', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'ps_1',
        sku: 'RFID-BAND',
        qty: 120,
        minQty: 40,
        venueId: 'venue_olympos_beach',
        status: 'ready',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('pass-stock', seed);
    return seed;
  }
  return list;
}

function openPassstockFlags() {
  const flags = readCollection('passstock-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPassstockFlag(candidate, actor = 'system') {
  const existing = readCollection('passstock-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('psf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('passstock-flags', list.slice(0, 200));
  return flag;
}

function isWristband(row) {
  return row.wristband === true || /band|wrist/i.test(String(row.sku || row.item || row.type || ''));
}

function isLowWristbandStock(row) {
  if (!isWristband(row)) return false;
  if (row.status === 'low_stock' || row.lowWristbandStock === true) return true;
  const qty = Number(row.qty ?? row.quantity ?? 0);
  const minQty = Number(row.minQty ?? row.threshold ?? 40);
  return qty <= minQty;
}

export function listPassstock(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPassstock(input = {}, actor = 'system') {
  const row = {
    id: rid('pas'),
    sku: input.sku !== undefined ? input.sku : 'CARD-PVC',
    qty: Number(input.qty ?? 50) || 0,
    minQty: Number(input.minQty ?? input.threshold ?? 10) || 0,
    venueId: input.venueId || 'venue_olympos_beach',
    status: input.status || 'ready',
    batchName: input.batchName || null,
    eventName: input.eventName || null,
    wristband: input.wristband === true || /band|wrist/i.test(String(input.sku || '')),
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pass-stock', row, 300);
  appendAudit({ actor, action: 'passstock.create', detail: String(row.sku || row.id), meta: { id: row.id } });
  return row;
}

export function updatePassstock(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  if (next.minQty !== undefined) next.minQty = Number(next.minQty) || 0;
  if (next.threshold !== undefined) next.threshold = Number(next.threshold) || 0;
  list[idx] = next;
  writeCollection('pass-stock', list);
  appendAudit({ actor, action: 'passstock.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function passstockSummary() {
  const list = listPassstock();
  const lowWristbands = list.filter(isLowWristbandStock);
  const eventBatches = list.filter((x) => x.eventBatch === true || x.batchType === 'event');
  const restocked = list.filter((x) => x.status === 'restocked' || x.restockedAt);
  const totalQty = list.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
  const flags = openPassstockFlags();
  return {
    title: 'LIKYA Passstock Ops',
    total: list.length,
    ready: list.filter((x) => x.status === 'ready').length,
    lowStock: lowWristbands.length,
    restocked: restocked.length,
    eventBatches: eventBatches.length,
    totalQty,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ready: list.filter((x) => x.status === 'ready').length,
      low_stock: lowWristbands.length,
      restocked: restocked.length,
      event_batches: eventBatches.length,
      total_qty: totalQty,
    },
    summaryLines: [
      `Passstock ${list.length} SKU - low wristbands ${lowWristbands.length} - qty ${totalQty}`,
      `Event batches ${eventBatches.length} - restocked ${restocked.length} - flag ${flags.length}`,
    ],
    items: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPassstockSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = passstockSummary();
  const created = [];
  const candidates = [];
  if (force || overview.lowStock > 0) {
    candidates.push({
      key: 'passstock_low_wristband_stock',
      level: overview.lowStock > 0 ? 'warn' : 'info',
      text: `Low wristband stock ${overview.lowStock}`,
      domain: 'wristband',
    });
  }
  if (force || overview.restocked > 0) {
    candidates.push({
      key: 'passstock_restock_flow',
      level: 'info',
      text: `Passstock restock flow ${overview.restocked}`,
      domain: 'restock',
    });
  }
  if (force || overview.eventBatches > 0) {
    candidates.push({
      key: 'passstock_event_batch',
      level: 'info',
      text: `Event batches ${overview.eventBatches}`,
      domain: 'event',
    });
  }
  for (const candidate of candidates) {
    const flag = addPassstockFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `passstock sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('passstock-sweeps', sweep, 80);
  appendAudit({ actor, action: 'passstock.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: passstockSummary() };
}

export function ackPassstockFlag(input = {}, actor = 'system') {
  const list = readCollection('passstock-flags', []) || [];
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
  writeCollection('passstock-flags', list);
  appendAudit({ actor, action: 'passstock.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: passstockSummary() };
}

export function markPassstockLowWristbandStock(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.sku && x.sku === input.sku));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isWristband);
  if (idx < 0) return { ok: false, error: 'Low stock yapilacak wristband yok' };
  const minQty = Number(input.minQty ?? list[idx].minQty ?? 40) || 40;
  list[idx] = {
    ...list[idx],
    status: 'low_stock',
    wristband: true,
    lowWristbandStock: true,
    qty: Number(input.qty ?? Math.max(0, minQty - 5)) || 0,
    minQty,
    lowStockAt: input.lowStockAt || new Date().toISOString(),
    lowStockBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('pass-stock', list);
  appendAudit({ actor, action: 'passstock.low_wristband_stock', detail: list[idx].sku || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, passstock: list[idx], overview: passstockSummary() };
}

export function restockPassstock(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.sku && x.sku === input.sku));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isLowWristbandStock);
  if (idx < 0) return { ok: false, error: 'Restock edilecek passstock yok' };
  const addQty = Number(input.qty ?? input.addQty ?? 120) || 120;
  list[idx] = {
    ...list[idx],
    status: 'restocked',
    qty: (Number(list[idx].qty) || 0) + addQty,
    lowWristbandStock: false,
    restockedAt: input.restockedAt || new Date().toISOString(),
    restockedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('pass-stock', list);
  appendAudit({ actor, action: 'passstock.restock', detail: list[idx].sku || list[idx].id, meta: { id: list[idx].id, qty: addQty } });
  return { ok: true, passstock: list[idx], overview: passstockSummary() };
}

export function seedEventBatch(input = {}, actor = 'system') {
  const passstock = createPassstock(
    {
      sku: input.sku || 'RFID-BAND-EVENT',
      qty: Number(input.qty ?? 80) || 80,
      minQty: Number(input.minQty ?? 40) || 40,
      venueId: input.venueId || 'venue_olympos_beach',
      status: input.status || 'ready',
      eventName: input.eventName || input.event || 'Campus event batch',
      batchName: input.batchName || 'Event wristband batch',
      wristband: true,
    },
    actor,
  );
  const patched = updatePassstock(
    passstock.id,
    {
      eventBatch: true,
      batchType: 'event',
      eventName: input.eventName || input.event || 'Campus event batch',
      batchSize: Number(input.batchSize ?? input.qty ?? 80) || 80,
    },
    actor,
  );
  appendAudit({ actor, action: 'passstock.seed_event_batch', detail: passstock.eventName || passstock.sku, meta: { id: passstock.id } });
  return { ok: true, passstock: patched || passstock, overview: passstockSummary() };
}
