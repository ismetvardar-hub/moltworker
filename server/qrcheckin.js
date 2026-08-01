/**
 * AŞAMA 126 — QR Check-in.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('qrcheckin', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'qrc_1',
      guestName: "Misafir",
      code: "QR-100",
      status: 'pending',
      at: new Date().toISOString(),
    }];
    writeCollection('qrcheckin', seed);
    return seed;
  }
  return list;
}

export function listQrcheckin(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createQrcheckin(input, actor = 'system') {
  const row = {
    id: `qrc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    code: input.code !== undefined ? input.code : "QR-100",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('qrcheckin', row, 300);
  appendAudit({
    actor,
    action: 'qrcheckin.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateQrcheckin(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('qrcheckin', list);
  appendAudit({ actor, action: 'qrcheckin.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function qrcheckinSummary() {
  const list = listQrcheckin();
  return {
    total: list.length,
    pending: list.filter((x) => x.status === 'pending').length,
    checked_in: list.filter((x) => x.status === 'checked_in').length,
    expired: list.filter((x) => x.status === 'expired').length,
    qrcheckin: list,
  };
}
