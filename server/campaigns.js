/**
 * AŞAMA 41 — Kampanya / promo motoru.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ensureSeed() {
  let list = readCollection('campaigns', null);
  if (!Array.isArray(list) || list.length === 0) {
    const d = today();
    list = [
      {
        id: 'cmp_1',
        name: 'Sahil Mutlu Saat',
        code: 'DAZE17',
        discountPct: 17,
        brandId: 'brand_daze',
        venueId: 'venue_olympos_beach',
        startDate: d,
        endDate: d,
        status: 'active',
        note: '17:00–19:00 seçili içecekler',
        createdAt: new Date().toISOString(),
      },
    ];
    writeCollection('campaigns', list);
  }
  return list;
}

export function listCampaigns(filter = {}) {
  let list = ensureSeed();
  if (filter.status) list = list.filter((c) => c.status === filter.status);
  if (filter.brandId) list = list.filter((c) => c.brandId === filter.brandId);
  return list.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
}

export function createCampaign(input, actor = 'system') {
  const campaign = {
    id: `cmp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'Kampanya',
    code: String(input.code || '').trim().toUpperCase() || 'PROMO',
    discountPct: Math.min(90, Math.max(0, Number(input.discountPct) || 0)),
    brandId: input.brandId || 'brand_daze',
    venueId: input.venueId || null,
    startDate: input.startDate || today(),
    endDate: input.endDate || today(),
    status: input.status || 'active',
    note: input.note || '',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('campaigns', campaign, 200);
  appendAudit({
    actor,
    action: 'campaigns.create',
    detail: `${campaign.name} (${campaign.code}) %${campaign.discountPct}`,
    meta: { id: campaign.id },
  });
  return campaign;
}

export function updateCampaign(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('campaigns', list);
  appendAudit({
    actor,
    action: 'campaigns.update',
    detail: `${list[idx].name} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function removeCampaign(id, actor = 'system') {
  const c = ensureSeed().find((x) => x.id === id);
  if (!c) return null;
  deleteItem('campaigns', id);
  appendAudit({ actor, action: 'campaigns.delete', detail: c.name, meta: { id } });
  return c;
}

export function campaignsSummary() {
  const list = listCampaigns();
  const d = today();
  const active = list.filter(
    (c) => c.status === 'active' && c.startDate <= d && c.endDate >= d,
  );
  return { total: list.length, active: active.length, campaigns: active };
}
