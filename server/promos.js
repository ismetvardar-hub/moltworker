/**
 * AŞAMA 133 — Promo Kod.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('promos', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'prm_1',
      code: "LIKYA10",
      discount: "10",
      status: 'active',
      at: new Date().toISOString(),
    }];
    writeCollection('promos', seed);
    return seed;
  }
  return list;
}

export function listPromos(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPromos(input, actor = 'system') {
  const row = {
    id: `prm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "LIKYA10",
    discount: input.discount !== undefined ? Number(input.discount) || 0 : 10,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('promos', row, 300);
  appendAudit({
    actor,
    action: 'promos.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePromos(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('promos', list);
  appendAudit({ actor, action: 'promos.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function promosSummary() {
  const list = listPromos();
  return {
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    expired: list.filter((x) => x.status === 'expired').length,
    promos: list,
  };
}
