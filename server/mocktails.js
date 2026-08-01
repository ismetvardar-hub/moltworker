/**
 * AŞAMA 132 — Mocktail Bar.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('mocktails', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mck_1',
      drink: "Sunset Cooler",
      qty: "2",
      status: 'ordered',
      at: new Date().toISOString(),
    }];
    writeCollection('mocktails', seed);
    return seed;
  }
  return list;
}

export function listMocktails(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createMocktails(input, actor = 'system') {
  const row = {
    id: `mck_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    drink: input.drink !== undefined ? input.drink : "Sunset Cooler",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 2,
    status: input.status || 'ordered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mocktails', row, 300);
  appendAudit({
    actor,
    action: 'mocktails.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMocktails(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mocktails', list);
  appendAudit({ actor, action: 'mocktails.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function mocktailsSummary() {
  const list = listMocktails();
  return {
    total: list.length,
    ordered: list.filter((x) => x.status === 'ordered').length,
    served: list.filter((x) => x.status === 'served').length,
    void: list.filter((x) => x.status === 'void').length,
    mocktails: list,
  };
}
