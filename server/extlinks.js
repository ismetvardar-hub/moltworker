/**
 * AŞAMA 151 — Entegrasyon bağlantı panosu (harici sistem durumları).
 * Not: server/integrations.js Vite plugin'ine ayrılmıştır; bu CRUD ayrıdır.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('extlinks', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ext_1',
      system: 'PMS',
      endpoint: 'https://pms.local',
      status: 'online',
      at: new Date().toISOString(),
    }];
    writeCollection('extlinks', seed);
    return seed;
  }
  return list;
}

export function listExtlinks(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createExtlinks(input, actor = 'system') {
  const row = {
    id: `ext_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : 'PMS',
    endpoint: input.endpoint !== undefined ? input.endpoint : 'https://pms.local',
    status: input.status || 'online',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('extlinks', row, 300);
  appendAudit({ actor, action: 'extlinks.create', detail: String(row.system || row.id), meta: { id: row.id } });
  return row;
}

export function updateExtlinks(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('extlinks', list);
  appendAudit({ actor, action: 'extlinks.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function extlinksSummary() {
  const list = listExtlinks();
  return {
    total: list.length,
    online: list.filter((x) => x.status === 'online').length,
    degraded: list.filter((x) => x.status === 'degraded').length,
    offline: list.filter((x) => x.status === 'offline').length,
    extlinks: list,
  };
}
