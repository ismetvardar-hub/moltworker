/**
 * AŞAMA 28 — AGORA tedarikçi & satınalma siparişleri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
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

function ensureSuppliers() {
  const list = readCollection('suppliers', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('suppliers', DEFAULT_SUPPLIERS);
    return DEFAULT_SUPPLIERS;
  }
  return list;
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
  return {
    suppliers: ensureSuppliers().length,
    openOrders: ensureOrders().filter((o) => o.status !== 'received' && o.status !== 'cancelled')
      .length,
  };
}
