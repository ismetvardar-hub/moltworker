/**
 * AŞAMA 319 — Otonom Checkout.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('autocheckout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aco_1', session: "AC-100",
      guestName: "Misafir", status: 'open', at: new Date().toISOString() }];
    writeCollection('autocheckout', seed);
    return seed;
  }
  return list;
}
export function listAutocheckout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAutocheckout(input, actor = 'system') {
  const row = {
    id: `aco_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    session: input.session !== undefined ? input.session : "AC-100",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('autocheckout', row, 300);
  appendAudit({
    actor,
    action: 'autocheckout.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAutocheckout(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('autocheckout', list);
  appendAudit({ actor, action: 'autocheckout.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function autocheckoutSummary() {
  const list = listAutocheckout();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    paid: list.filter((x) => x.status === 'paid').length,
    void: list.filter((x) => x.status === 'void').length, autocheckout: list };
}
