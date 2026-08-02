/**
 * AŞAMA 28 — AGORA tedarikçi & satınalma siparişleri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { adjustStock } from './inventory.js';

const DEFAULT_SUPPLIERS = [
  {
    id: 'sup_agora_meat',
    name: 'Likya Et Tedarik',
    category: 'gıda',
    contact: 'ali@likyaet.example',
    phone: '+902421111111',
    leadDays: 2,
    status: 'active',
  },
  {
    id: 'sup_agora_bev',
    name: 'Akdeniz İçecek',
    category: 'içecek',
    contact: 'siparis@akdeniz.example',
    phone: '+902422222222',
    leadDays: 1,
    status: 'active',
  },
  {
    id: 'sup_agora_rfid',
    name: 'NEXUS Tags TR',
    category: 'donanım',
    contact: 'sales@nexustags.example',
    phone: '+902423333333',
    leadDays: 5,
    status: 'active',
  },
];

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensureSuppliers() {
  const list = readCollection('suppliers', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('suppliers', DEFAULT_SUPPLIERS);
    return DEFAULT_SUPPLIERS;
  }
  return list;
}

function isOpenOrder(o) {
  return o.status !== 'received' && o.status !== 'cancelled';
}

function orderDueAt(order) {
  if (order.expectedAt) {
    const expected = Date.parse(order.expectedAt);
    if (Number.isFinite(expected)) return expected;
  }
  const created = Date.parse(order.createdAt || 0);
  if (!Number.isFinite(created)) return null;
  const supplier = ensureSuppliers().find((s) => s.id === order.supplierId);
  const leadDays = Math.max(1, Number(order.leadDays ?? supplier?.leadDays) || 3);
  return created + leadDays * 86400_000;
}

function overdueOrders() {
  const now = Date.now();
  return ensureOrders().filter((o) => {
    if (!isOpenOrder(o)) return false;
    const due = orderDueAt(o);
    return due != null && due < now;
  });
}

function ensureOrders() {
  const list = readCollection('purchase-orders', null);
  if (!Array.isArray(list)) {
    writeCollection('purchase-orders', []);
    return [];
  }
  return list;
}

export function listSuppliers() {
  return ensureSuppliers();
}

export function createSupplier(input, actor = 'system') {
  const supplier = {
    id: `sup_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'Tedarikçi',
    category: input.category || 'genel',
    contact: input.contact || '',
    phone: input.phone || '',
    leadDays: Number(input.leadDays) || 3,
    status: input.status || 'active',
    createdAt: new Date().toISOString(),
  };
  prependItem('suppliers', supplier, 100);
  appendAudit({
    actor,
    action: 'suppliers.create',
    detail: supplier.name,
    meta: { id: supplier.id },
  });
  return supplier;
}

export function listPurchaseOrders(filter = {}) {
  let list = ensureOrders();
  if (filter.status) list = list.filter((o) => o.status === filter.status);
  if (filter.supplierId) list = list.filter((o) => o.supplierId === filter.supplierId);
  return list;
}

export function createPurchaseOrder(input, actor = 'system') {
  const suppliers = ensureSuppliers();
  const supplier = suppliers.find((s) => s.id === input.supplierId) || suppliers[0];
  const lines = Array.isArray(input.lines)
    ? input.lines.map((l) => ({
        sku: l.sku || '',
        name: l.name || l.sku || 'Kalem',
        qty: Math.max(1, Number(l.qty) || 1),
        unit: l.unit || 'adet',
        itemId: l.itemId || null,
      }))
    : [];
  const order = {
    id: `po_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    supplierId: supplier?.id || null,
    supplierName: supplier?.name || 'Tedarikçi',
    status: 'draft',
    lines,
    note: input.note || '',
    venueId: input.venueId || null,
    createdAt: new Date().toISOString(),
    expectedAt:
      input.expectedAt ||
      new Date(Date.now() + Math.max(1, Number(supplier?.leadDays) || 3) * 86400_000).toISOString(),
    createdBy: actor,
  };
  prependItem('purchase-orders', order, 200);
  appendAudit({
    actor,
    action: 'po.create',
    detail: `${order.supplierName} · ${lines.length} kalem`,
    meta: { id: order.id },
  });
  return order;
}

export function updatePurchaseOrder(id, patch, actor = 'system') {
  const list = ensureOrders();
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (patch.lines) {
    next.lines = patch.lines.map((l) => ({
      sku: l.sku || '',
      name: l.name || l.sku || 'Kalem',
      qty: Math.max(1, Number(l.qty) || 1),
      unit: l.unit || 'adet',
      itemId: l.itemId || null,
    }));
  }
  list[idx] = next;
  writeCollection('purchase-orders', list);
  appendAudit({
    actor,
    action: 'po.update',
    detail: `${next.id} → ${next.status}`,
    meta: { id },
  });
  return next;
}

/** Siparişi teslim al — stoka işler */
export function receivePurchaseOrder(id, actor = 'system') {
  const list = ensureOrders();
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const order = list[idx];
  if (order.status === 'received') return { order, movements: [] };

  const movements = [];
  for (const line of order.lines || []) {
    if (line.itemId) {
      const result = adjustStock(
        { id: line.itemId, delta: line.qty, reason: `po:${order.id}` },
        actor,
      );
      if (result) movements.push(result.movement);
    }
  }

  list[idx] = {
    ...order,
    status: 'received',
    receivedAt: new Date().toISOString(),
    receivedBy: actor,
  };
  writeCollection('purchase-orders', list);
  appendAudit({
    actor,
    action: 'po.receive',
    detail: `${order.supplierName} teslim · ${movements.length} stok hareketi`,
    meta: { id },
  });
  return { order: list[idx], movements };
}

export function removePurchaseOrder(id, actor = 'system') {
  const o = ensureOrders().find((x) => x.id === id);
  if (!o) return null;
  if (o.status === 'received') return null;
  deleteItem('purchase-orders', id);
  appendAudit({ actor, action: 'po.delete', detail: o.supplierName, meta: { id } });
  return o;
}

export function suppliersSummary() {
  const suppliers = ensureSuppliers();
  const orders = ensureOrders();
  const flags = readCollection('suppliers-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const openOrders = orders.filter(isOpenOrder);
  const overdue = overdueOrders();
  return {
    title: 'LİKYA Tedarik / AGORA',
    suppliers: suppliers.length,
    totalSuppliers: suppliers.length,
    openOrders: openOrders.length,
    overdueOrders: overdue.length,
    receivedOrders: orders.filter((o) => o.status === 'received').length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      suppliers: suppliers.length,
      open_orders: openOrders.length,
      overdue_orders: overdue.length,
      received_orders: orders.filter((o) => o.status === 'received').length,
    },
    summaryLines: [
      `Tedarikçi ${suppliers.length} · açık PO ${openOrders.length} · geciken ${overdue.length}`,
      `Supplier flag ${openFlags.length} açık`,
    ],
  };
}

export function runSuppliersSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = suppliersSummary();
  const orders = ensureOrders();
  const existing = readCollection('suppliers-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.overdueOrders || 0) > 0) {
    candidates.push({
      key: 'po_overdue',
      level: (overview.overdueOrders || 0) > 2 ? 'alert' : 'warn',
      text: `Geciken satınalma siparişi ${overview.overdueOrders || 0}`,
      domain: 'purchase-orders',
    });
  }
  if (force || (overview.openOrders || 0) === 0) {
    candidates.push({
      key: 'po_backlog_empty',
      level: 'info',
      text: `Açık PO ${overview.openOrders || 0}`,
      domain: 'backlog',
    });
  }
  const inactive = ensureSuppliers().filter((s) => s.status !== 'active').length;
  if (force || inactive > 0) {
    candidates.push({
      key: 'supplier_inactive',
      level: inactive > 0 ? 'warn' : 'info',
      text: `Pasif tedarikçi ${inactive}`,
      domain: 'supplier',
    });
  }
  if (force && !orders.length) {
    candidates.push({ key: 'po_empty', level: 'info', text: 'PO defteri boş', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('supf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('suppliers-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `suppliers sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('sups'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('suppliers-sweeps', sweep, 80);
  appendAudit({ actor, action: 'suppliers.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: suppliersSummary() };
}

export function ackSuppliersFlag(input = {}, actor = 'system') {
  const list = readCollection('suppliers-flags', []) || [];
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
  writeCollection('suppliers-flags', list);
  appendAudit({ actor, action: 'suppliers.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: suppliersSummary() };
}

/** Mutator 1 — receive an open PO, wrapping the stock-aware primitive. */
export function receiveSupplierPurchaseOrder(input = {}, actor = 'system') {
  let id = input.id || input.orderId;
  if (!id) {
    const target = listPurchaseOrders().find(isOpenOrder);
    id = target?.id;
  }
  if (!id) {
    const seeded = seedOpenPurchaseOrder({}, actor);
    id = seeded.order?.id;
  }
  const result = id ? receivePurchaseOrder(id, actor) : null;
  if (!result) return { ok: false, error: 'Sipariş bulunamadı' };
  appendAudit({
    actor,
    action: 'suppliers.po_receive_ops',
    detail: `${result.order.supplierName} teslim`,
    meta: { id },
  });
  return { ok: true, ...result, received: [result.order.id], overview: suppliersSummary() };
}

/** Mutator 2 — create flags for overdue open purchase orders. */
export function flagOverduePurchaseOrders(input = {}, actor = 'system') {
  let overdue = overdueOrders();
  if (!overdue.length && input.seed !== false) {
    seedOpenPurchaseOrder({ overdue: true }, actor);
    overdue = overdueOrders();
  }
  const existing = readCollection('suppliers-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  for (const order of overdue.slice(0, Number(input.limit) || 20)) {
    const key = `po_overdue_${order.id}`;
    if (openKeys.has(key)) continue;
    const flag = {
      id: rid('supf'),
      key,
      level: 'warn',
      text: `PO gecikti · ${order.supplierName} · ${order.id}`,
      domain: 'purchase-orders',
      order_id: order.id,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(flag);
    created.push(flag);
    openKeys.add(key);
  }
  writeCollection('suppliers-flags', list.slice(0, 200));
  appendAudit({ actor, action: 'suppliers.po_overdue_flag', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, created, overview: suppliersSummary() };
}

/** Mutator 3 — seed an open PO, optionally backdated for overdue flows. */
export function seedOpenPurchaseOrder(input = {}, actor = 'system') {
  const supplier = ensureSuppliers().find((s) => s.id === input.supplierId) || ensureSuppliers()[0];
  const overdue = !!input.overdue;
  const order = createPurchaseOrder(
    {
      supplierId: supplier?.id,
      venueId: input.venueId || 'venue_olympos_beach',
      note: input.note || (overdue ? 'overdue seed' : 'open PO seed'),
      expectedAt: overdue
        ? new Date(Date.now() - 2 * 86400_000).toISOString()
        : new Date(Date.now() + 2 * 86400_000).toISOString(),
      lines: Array.isArray(input.lines) && input.lines.length
        ? input.lines
        : [
            {
              itemId: input.itemId || 'inv_rfid',
              sku: input.sku || 'RF-TAG',
              name: input.name || 'RFID bileklik',
              qty: Math.max(1, Number(input.qty) || 10),
              unit: input.unit || 'adet',
            },
          ],
    },
    actor,
  );
  const list = ensureOrders();
  const idx = list.findIndex((o) => o.id === order.id);
  if (idx >= 0 && overdue) {
    list[idx] = {
      ...list[idx],
      createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
      expectedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    };
    writeCollection('purchase-orders', list);
  }
  appendAudit({ actor, action: 'suppliers.po_seed_open', detail: order.supplierName, meta: { id: order.id, overdue } });
  return { ok: true, order: ensureOrders().find((o) => o.id === order.id) || order, overview: suppliersSummary() };
}
