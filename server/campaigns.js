/**
 * AŞAMA 41 — Kampanya / promo motoru.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function addDays(days) {
  return new Date(Date.now() + Number(days) * 86400_000).toISOString().slice(0, 10);
}

function daysUntil(date) {
  const end = Date.parse(`${date}T23:59:59.000Z`);
  if (!Number.isFinite(end)) return null;
  return Math.ceil((end - Date.now()) / 86400_000);
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
  const expired = list.filter((c) => c.status === 'active' && c.endDate < d);
  const endingSoon = active.filter((c) => {
    const left = daysUntil(c.endDate);
    return left != null && left <= 3;
  });
  const flags = readCollection('campaigns-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA Kampanya Ops',
    total: list.length,
    active: active.length,
    expired: expired.length,
    endingSoon: endingSoon.length,
    campaigns: active,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      active: active.length,
      expired: expired.length,
      ending_soon: endingSoon.length,
    },
    summaryLines: [
      `Kampanya ${list.length} · aktif ${active.length} · süresi geçmiş ${expired.length}`,
      `Bitmek üzere ${endingSoon.length} · campaign flag ${openFlags.length} açık`,
    ],
  };
}

export function runCampaignsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = campaignsSummary();
  const existing = readCollection('campaigns-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.expired || 0) > 0) {
    candidates.push({
      key: 'campaigns_expired',
      level: (overview.expired || 0) > 0 ? 'warn' : 'info',
      text: `Süresi geçmiş aktif kampanya ${overview.expired || 0}`,
      domain: 'expiry',
    });
  }
  if (force || (overview.endingSoon || 0) > 0) {
    candidates.push({
      key: 'campaigns_ending_soon',
      level: 'info',
      text: `Bitmek üzere kampanya ${overview.endingSoon || 0}`,
      domain: 'expiry',
    });
  }
  if (force || (overview.active || 0) === 0) {
    candidates.push({
      key: 'campaigns_no_active',
      level: (overview.active || 0) === 0 ? 'warn' : 'info',
      text: `Aktif kampanya ${overview.active || 0}`,
      domain: 'activation',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('cmpf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('campaigns-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `campaigns sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cmps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('campaigns-sweeps', sweep, 80);
  appendAudit({ actor, action: 'campaigns.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: campaignsSummary() };
}

export function ackCampaignsFlag(input = {}, actor = 'system') {
  const list = readCollection('campaigns-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('campaigns-flags', list);
  appendAudit({ actor, action: 'campaigns.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: campaignsSummary() };
}

/** Mutator 1 — activate a paused/scheduled campaign, or create one. */
export function activateCampaignOps(input = {}, actor = 'system') {
  let row = null;
  if (input.id) row = ensureSeed().find((c) => c.id === input.id);
  if (!row) row = listCampaigns().find((c) => c.status !== 'active') || listCampaigns()[0];
  if (!row) {
    row = createCampaign({ name: 'activation seed', code: 'LIVE156', discountPct: 12, endDate: addDays(7) }, actor);
  }
  const campaign = updateCampaign(
    row.id,
    {
      status: 'active',
      startDate: input.startDate || today(),
      endDate: input.endDate || addDays(Number(input.days) || 7),
      note: input.note || row.note || 'activated by ops',
    },
    actor,
  );
  if (!campaign) return { ok: false, error: 'Kampanya bulunamadı' };
  appendAudit({ actor, action: 'campaigns.activate_ops', detail: campaign.name, meta: { id: campaign.id } });
  return { ok: true, campaign, activated: [campaign.id], overview: campaignsSummary() };
}

/** Mutator 2 — expire active campaigns whose end date has passed, or a target. */
export function expireCampaignOps(input = {}, actor = 'system') {
  const d = today();
  let rows = listCampaigns().filter((c) => c.status === 'active' && (input.id ? c.id === input.id : c.endDate <= d));
  if (!rows.length && input.seed !== false) {
    const seeded = createCampaign({
      name: 'expired campaign seed',
      code: 'EXP156',
      discountPct: 15,
      startDate: addDays(-5),
      endDate: addDays(-1),
      status: 'active',
      note: 'expiry seed',
    }, actor);
    rows = [seeded];
  }
  const expired = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    const next = updateCampaign(row.id, { status: 'expired', endDate: row.endDate || d, note: input.note || row.note || 'expired by ops' }, actor);
    if (next) expired.push(next.id);
  }
  appendAudit({ actor, action: 'campaigns.expire_ops', detail: `${expired.length}`, meta: { n: expired.length } });
  return { ok: true, expired, overview: campaignsSummary() };
}

/** Mutator 3 — seed a campaign ending soon for expiry playbooks. */
export function seedEndingSoonCampaign(input = {}, actor = 'system') {
  const campaign = createCampaign(
    {
      name: input.name || 'Ending soon seed',
      code: input.code || `SOON${String(Date.now()).slice(-3)}`,
      discountPct: Number(input.discountPct) || 18,
      brandId: input.brandId || 'brand_daze',
      venueId: input.venueId || 'venue_olympos_beach',
      startDate: input.startDate || today(),
      endDate: input.endDate || addDays(Number(input.days) || 1),
      status: 'active',
      note: input.note || 'ending soon seed',
    },
    actor,
  );
  appendAudit({ actor, action: 'campaigns.seed_ending_soon', detail: campaign.name, meta: { id: campaign.id } });
  return { ok: true, campaign, seeded: [campaign.id], overview: campaignsSummary() };
}
