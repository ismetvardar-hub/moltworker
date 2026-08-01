/**
 * AŞAMA 290 — Reklam Harcama.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('adspend', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ads_1', campaign: "Summer",
      amount: "12000", status: 'planned', at: new Date().toISOString() }];
    writeCollection('adspend', seed);
    return seed;
  }
  return list;
}
export function listAdspend(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAdspend(input, actor = 'system') {
  const row = {
    id: `ads_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    campaign: input.campaign !== undefined ? input.campaign : "Summer",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 12000,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('adspend', row, 300);
  appendAudit({ actor, action: 'adspend.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateAdspend(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('adspend', list);
  appendAudit({ actor, action: 'adspend.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function adspendSummary() {
  const list = listAdspend();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    closed: list.filter((x) => x.status === 'closed').length, adspend: list };
}
