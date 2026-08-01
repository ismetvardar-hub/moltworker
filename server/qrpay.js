/**
 * AŞAMA 327 — QR Pay.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('qrpay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'qrp_1', code: "QR-900",
      amount: "250", status: 'pending', at: new Date().toISOString() }];
    writeCollection('qrpay', seed);
    return seed;
  }
  return list;
}
export function listQrpay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createQrpay(input, actor = 'system') {
  const row = {
    id: `qrp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "QR-900",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 250,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('qrpay', row, 300);
  appendAudit({
    actor,
    action: 'qrpay.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateQrpay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('qrpay', list);
  appendAudit({ actor, action: 'qrpay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function qrpaySummary() {
  const list = listQrpay();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    paid: list.filter((x) => x.status === 'paid').length,
    expired: list.filter((x) => x.status === 'expired').length, qrpay: list };
}
