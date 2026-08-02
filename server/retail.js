import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 168 - Retail stock ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('retail', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'rtl_1',
      sku: "Şapka",
      qty: 2,
      threshold: 3,
      status: 'sold',
      at: new Date().toISOString(),
    }];
    writeCollection('retail', seed);
    return seed;
  }
  return list;
}

function openRetailFlags() {
  const flags = readCollection('retail-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addRetailFlag(candidate, actor = 'system') {
  const existing = readCollection('retail-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('rtf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('retail-flags', list.slice(0, 200));
  return flag;
}

function isLowStock(row) {
  if (row.status === 'low_stock' || row.lowStock === true) return true;
  const qty = Number(row.qty ?? row.quantity ?? 0);
  const threshold = Number(row.threshold ?? row.minQty ?? 3);
  return qty <= threshold;
}

export function listRetail(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createRetail(input = {}, actor = 'system') {
  const row = {
    id: rid('rtl'),
    sku: input.sku !== undefined ? input.sku : "Şapka",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 2,
    threshold: Number(input.threshold ?? input.minQty ?? 3) || 3,
    price: Number(input.price ?? 0) || 0,
    campaign: input.campaign || null,
    status: input.status || 'sold',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('retail', row, 300);
  appendAudit({
    actor,
    action: 'retail.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateRetail(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  if (next.threshold !== undefined) next.threshold = Number(next.threshold) || 0;
  if (next.price !== undefined) next.price = Number(next.price) || 0;
  list[idx] = next;
  writeCollection('retail', list);
  appendAudit({ actor, action: 'retail.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function retailSummary() {
  const list = listRetail();
  const lowStock = list.filter(isLowStock);
  const flashSales = list.filter((x) => x.flashSale === true || x.status === 'flash_sale');
  const stockQty = list.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
  const flags = openRetailFlags();
  return {
    title: 'LIKYA Retail Ops',
    total: list.length,
    sold: list.filter((x) => x.status === 'sold').length,
    refund: list.filter((x) => x.status === 'refund').length,
    hold: list.filter((x) => x.status === 'hold').length,
    restocked: list.filter((x) => x.status === 'restocked').length,
    lowStock: lowStock.length,
    flashSales: flashSales.length,
    stockQty,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      sold: list.filter((x) => x.status === 'sold').length,
      refund: list.filter((x) => x.status === 'refund').length,
      hold: list.filter((x) => x.status === 'hold').length,
      restocked: list.filter((x) => x.status === 'restocked').length,
      low_stock: lowStock.length,
      flash_sales: flashSales.length,
      stock_qty: stockQty,
    },
    summaryLines: [
      `Retail ${list.length} SKU - low stock ${lowStock.length} - stock qty ${stockQty}`,
      `Flash sales ${flashSales.length} - restocked ${list.filter((x) => x.status === 'restocked').length} - flag ${flags.length}`,
    ],
    retail: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runRetailSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = retailSummary();
  const created = [];
  const candidates = [];
  if (force || overview.lowStock > 0) {
    candidates.push({
      key: 'retail_low_stock_sku',
      level: overview.lowStock > 0 ? 'warn' : 'info',
      text: `Retail low stock SKU ${overview.lowStock}`,
      domain: 'stock',
    });
  }
  if (force || overview.flashSales > 0) {
    candidates.push({
      key: 'retail_flash_sale',
      level: 'info',
      text: `Retail flash sales ${overview.flashSales}`,
      domain: 'campaign',
    });
  }
  if (force || overview.stockQty < overview.total * 3) {
    candidates.push({
      key: 'retail_restock_queue',
      level: overview.stockQty < overview.total * 3 ? 'warn' : 'info',
      text: `Retail stock quantity ${overview.stockQty}`,
      domain: 'restock',
    });
  }
  for (const candidate of candidates) {
    const flag = addRetailFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `retail sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('rts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('retail-sweeps', sweep, 80);
  appendAudit({ actor, action: 'retail.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: retailSummary() };
}

export function ackRetailFlag(input = {}, actor = 'system') {
  const list = readCollection('retail-flags', []) || [];
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
  writeCollection('retail-flags', list);
  appendAudit({ actor, action: 'retail.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: retailSummary() };
}

export function markRetailLowStockSku(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.sku && x.sku === input.sku));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isLowStock(x));
  const targetIdx = idx >= 0 ? idx : 0;
  if (targetIdx < 0 || !list[targetIdx]) return { ok: false, error: 'Low stock yapilacak SKU yok' };
  list[targetIdx] = {
    ...list[targetIdx],
    status: 'low_stock',
    qty: Number(input.qty ?? 1) || 1,
    threshold: Number(input.threshold ?? list[targetIdx].threshold ?? 3) || 3,
    lowStock: true,
    lowStockAt: input.lowStockAt || new Date().toISOString(),
    lowStockBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('retail', list);
  appendAudit({ actor, action: 'retail.low_stock_sku', detail: list[targetIdx].sku || list[targetIdx].id, meta: { id: list[targetIdx].id } });
  return { ok: true, retail: list[targetIdx], overview: retailSummary() };
}

export function restockRetailSku(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.sku && x.sku === input.sku));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isLowStock);
  if (idx < 0) return { ok: false, error: 'Restock edilecek SKU yok' };
  const addQty = Number(input.qty ?? input.addQty ?? 12) || 12;
  list[idx] = {
    ...list[idx],
    status: 'restocked',
    qty: (Number(list[idx].qty) || 0) + addQty,
    lowStock: false,
    restockedAt: input.restockedAt || new Date().toISOString(),
    restockedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('retail', list);
  appendAudit({ actor, action: 'retail.restock', detail: list[idx].sku || list[idx].id, meta: { id: list[idx].id, qty: addQty } });
  return { ok: true, retail: list[idx], overview: retailSummary() };
}

export function seedFlashSale(input = {}, actor = 'system') {
  const retail = createRetail(
    {
      sku: input.sku || 'Flash resort tote',
      qty: Number(input.qty ?? 18) || 18,
      threshold: Number(input.threshold ?? 4) || 4,
      price: Number(input.price ?? 49) || 49,
      campaign: input.campaign || 'Flash sale',
      status: input.status || 'flash_sale',
    },
    actor,
  );
  updateRetail(retail.id, { flashSale: true, discountPct: Number(input.discountPct ?? 25) || 25 }, actor);
  appendAudit({ actor, action: 'retail.seed_flash_sale', detail: retail.sku, meta: { id: retail.id } });
  return { ok: true, retail: { ...retail, flashSale: true, discountPct: Number(input.discountPct ?? 25) || 25 }, overview: retailSummary() };
}
