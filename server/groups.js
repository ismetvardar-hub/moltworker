/**
 * AŞAMA 108 — Grup Rezervasyon.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('groups', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'grp_1',
      groupName: "Kurumsal",
      pax: "40",
      status: 'inquiry',
      at: new Date().toISOString(),
    }];
    writeCollection('groups', seed);
    return seed;
  }
  return list;
}

export function listGroups(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createGroups(input, actor = 'system') {
  const row = {
    id: `grp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    groupName: input.groupName !== undefined ? input.groupName : "Kurumsal",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 40,
    status: input.status || 'inquiry',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('groups', row, 300);
  appendAudit({
    actor,
    action: 'groups.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateGroups(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('groups', list);
  appendAudit({ actor, action: 'groups.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function groupsSummary() {
  const list = listGroups();
  return {
    total: list.length,
    inquiry: list.filter((x) => x.status === 'inquiry').length,
    blocked: list.filter((x) => x.status === 'blocked').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    groups: list,
  };
}
