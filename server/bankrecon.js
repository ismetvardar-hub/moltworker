/**
 * AŞAMA 579 — Bank Recon.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bankrecon', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'brc_1', account: "Ops TRY",
      diff: "0", status: 'open', at: new Date().toISOString() }];
    writeCollection('bankrecon', seed);
    return seed;
  }
  return list;
}
export function listBankrecon(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBankrecon(input, actor = 'system') {
  const row = {
    id: `brc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    account: input.account !== undefined ? input.account : "Ops TRY",
    diff: input.diff !== undefined ? Number(input.diff) || 0 : 0,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bankrecon', row, 300);
  appendAudit({
    actor,
    action: 'bankrecon.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBankrecon(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bankrecon', list);
  appendAudit({ actor, action: 'bankrecon.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bankreconSummary() {
  const list = listBankrecon();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    matched: list.filter((x) => x.status === 'matched').length,
    exception: list.filter((x) => x.status === 'exception').length, bankrecon: list };
}
