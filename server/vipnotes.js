/**
 * AŞAMA 109 — VIP Notları.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('vipnotes', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'vip_1',
      guestName: "VIP Misafir",
      note: "Sessiz oda",
      status: 'active',
      at: new Date().toISOString(),
    }];
    writeCollection('vipnotes', seed);
    return seed;
  }
  return list;
}

export function listVipnotes(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createVipnotes(input, actor = 'system') {
  const row = {
    id: `vip_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "VIP Misafir",
    note: input.note !== undefined ? input.note : "Sessiz oda",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vipnotes', row, 300);
  appendAudit({
    actor,
    action: 'vipnotes.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateVipnotes(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vipnotes', list);
  appendAudit({ actor, action: 'vipnotes.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function vipnotesSummary() {
  const list = listVipnotes();
  return {
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    archived: list.filter((x) => x.status === 'archived').length,
    vipnotes: list,
  };
}
