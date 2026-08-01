/**
 * AŞAMA 664 — Sponsor Pack.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sponsorpack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'spp_1', pack: "Arena gold",
      value: "250000", status: 'pitched', at: new Date().toISOString() }];
    writeCollection('sponsorpack', seed);
    return seed;
  }
  return list;
}
export function listSponsorpack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSponsorpack(input, actor = 'system') {
  const row = {
    id: `spp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pack: input.pack !== undefined ? input.pack : "Arena gold",
    value: input.value !== undefined ? Number(input.value) || 0 : 250000,
    status: input.status || 'pitched',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sponsorpack', row, 300);
  appendAudit({
    actor,
    action: 'sponsorpack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSponsorpack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sponsorpack', list);
  appendAudit({ actor, action: 'sponsorpack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sponsorpackSummary() {
  const list = listSponsorpack();
  return { total: list.length, pitched: list.filter((x) => x.status === 'pitched').length,
    signed: list.filter((x) => x.status === 'signed').length,
    live: list.filter((x) => x.status === 'live').length, sponsorpack: list };
}
