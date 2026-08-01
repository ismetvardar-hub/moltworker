/**
 * AŞAMA 88 — Partner Oteller.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('partner-hotels', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'par_1',
      name: "Partner Hotel",
      contact: "sales@",
      status: 'active',
      at: new Date().toISOString(),
    }];
    writeCollection('partner-hotels', seed);
    return seed;
  }
  return list;
}

export function listPartners(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPartners(input, actor = 'system') {
  const row = {
    id: `par_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Partner Hotel",
    contact: input.contact !== undefined ? input.contact : "sales@",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('partner-hotels', row, 300);
  appendAudit({
    actor,
    action: 'partners.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePartners(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('partner-hotels', list);
  appendAudit({ actor, action: 'partners.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function partnersSummary() {
  const list = listPartners();
  return {
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    partners: list,
  };
}
