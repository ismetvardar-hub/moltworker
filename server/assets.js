/**
 * AŞAMA 46 — Fiziksel varlık / ekipman envanteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensureSeed() {
  let list = readCollection('assets', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'ast_gate_01',
        name: 'NEXUS Turnike #1',
        category: 'access',
        venueId: 'venue_olympos_beach',
        status: 'online',
        serial: 'NX-GATE-01',
        note: 'Ana giriş',
      },
      {
        id: 'ast_oven_01',
        name: 'Izgara ünitesi',
        category: 'kitchen',
        venueId: 'venue_kaleici',
        status: 'online',
        serial: 'KF-GRILL-2',
        note: '',
      },
      {
        id: 'ast_pos_01',
        name: 'POS terminal',
        category: 'pos',
        venueId: 'venue_olympos_beach',
        status: 'maintenance',
        serial: 'POS-17',
        note: 'Yazıcı değişimi bekliyor',
      },
    ];
    writeCollection('assets', list);
  }
  return list;
}

export function listAssets(filter = {}) {
  let list = ensureSeed();
  if (filter.venueId) list = list.filter((a) => a.venueId === filter.venueId);
  if (filter.status) list = list.filter((a) => a.status === filter.status);
  return list;
}

export function createAsset(input, actor = 'system') {
  const asset = {
    id: `ast_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'Varlık',
    category: input.category || 'general',
    venueId: input.venueId || null,
    status: input.status || 'online',
    serial: input.serial || '',
    note: input.note || '',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('assets', asset, 300);
  appendAudit({
    actor,
    action: 'assets.create',
    detail: asset.name,
    meta: { id: asset.id },
  });
  return asset;
}

export function updateAsset(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('assets', list);
  appendAudit({
    actor,
    action: 'assets.update',
    detail: `${list[idx].name} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function assetsSummary() {
  const list = listAssets();
  return {
    total: list.length,
    online: list.filter((a) => a.status === 'online').length,
    maintenance: list.filter((a) => a.status === 'maintenance').length,
  };
}
