/**
 * AŞAMA 131 — Özel Şef.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('privatechef', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'pch_1',
      guestName: "Misafir",
      menu: "Deniz",
      status: 'inquiry',
      at: new Date().toISOString(),
    }];
    writeCollection('privatechef', seed);
    return seed;
  }
  return list;
}

export function listPrivatechef(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPrivatechef(input, actor = 'system') {
  const row = {
    id: `pch_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    menu: input.menu !== undefined ? input.menu : "Deniz",
    status: input.status || 'inquiry',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('privatechef', row, 300);
  appendAudit({
    actor,
    action: 'privatechef.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePrivatechef(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('privatechef', list);
  appendAudit({ actor, action: 'privatechef.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function privatechefSummary() {
  const list = listPrivatechef();
  return {
    total: list.length,
    inquiry: list.filter((x) => x.status === 'inquiry').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    served: list.filter((x) => x.status === 'served').length,
    privatechef: list,
  };
}
