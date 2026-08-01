/**
 * AŞAMA 321 — İkram Teklifi.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('treatoffer', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trt_1', guestName: "Misafir",
      treat: "Tatlı", status: 'offered', at: new Date().toISOString() }];
    writeCollection('treatoffer', seed);
    return seed;
  }
  return list;
}
export function listTreatoffer(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTreatoffer(input, actor = 'system') {
  const row = {
    id: `trt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    treat: input.treat !== undefined ? input.treat : "Tatlı",
    status: input.status || 'offered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('treatoffer', row, 300);
  appendAudit({
    actor,
    action: 'treatoffer.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTreatoffer(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('treatoffer', list);
  appendAudit({ actor, action: 'treatoffer.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function treatofferSummary() {
  const list = listTreatoffer();
  return { total: list.length, offered: list.filter((x) => x.status === 'offered').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    declined: list.filter((x) => x.status === 'declined').length, treatoffer: list };
}
