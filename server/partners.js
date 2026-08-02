/**
 * Wave 175 - Partner channel ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('partner-hotels', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'par_1',
      name: "Partner Hotel",
      contact: "sales@",
      status: 'active',
      at: new Date().toISOString(),
    }];
    writeCollection('partner-hotels', seed);
    return seed;
  }
  return list;
}

function openPartnersFlags() {
  const flags = readCollection('partners-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPartnersFlag(candidate, actor = 'system') {
  const existing = readCollection('partners-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('paf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('partners-flags', list.slice(0, 200));
  return flag;
}

function isInactivePartner(row) {
  return row.inactive === true || row.status === 'inactive' || row.status === 'paused';
}

function isRenewedPartner(row) {
  return row.renewed === true || row.status === 'renewed' || row.renewedAt;
}

function isChannelDeal(row) {
  return row.channelDeal === true || row.dealType === 'channel_deal';
}

export function listPartners(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPartners(input = {}, actor = 'system') {
  const row = {
    id: rid('par'),
    name: input.name !== undefined ? input.name : "Partner Hotel",
    contact: input.contact !== undefined ? input.contact : "sales@",
    channel: input.channel !== undefined ? input.channel : undefined,
    rateCode: input.rateCode !== undefined ? input.rateCode : undefined,
    dealType: input.dealType !== undefined ? input.dealType : undefined,
    channelDeal: input.channelDeal === true || undefined,
    status: input.status || 'active',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('partner-hotels', row, 300);
  appendAudit({
    actor,
    action: 'partners.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePartners(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('partner-hotels', list);
  appendAudit({ actor, action: 'partners.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function partnersSummary() {
  const list = listPartners();
  const inactive = list.filter(isInactivePartner);
  const renewed = list.filter(isRenewedPartner);
  const channelDeals = list.filter(isChannelDeal);
  const flags = openPartnersFlags();
  return {
    title: 'LIKYA Partner Channel Ops',
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    inactive: inactive.length,
    renewed: renewed.length,
    channelDeals: channelDeals.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => x.status === 'active').length,
      paused: list.filter((x) => x.status === 'paused').length,
      inactive: inactive.length,
      renewed: renewed.length,
      channel_deals: channelDeals.length,
    },
    summaryLines: [
      `Partners ${list.length} hotel - inactive ${inactive.length} - renewed ${renewed.length}`,
      `Active ${list.filter((x) => x.status === 'active').length} - channel deals ${channelDeals.length} - flag ${flags.length}`,
    ],
    partners: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPartnersSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = partnersSummary();
  const created = [];
  const candidates = [];
  if (force || overview.inactive > 0) {
    candidates.push({
      key: 'partners_inactive_partner',
      level: overview.inactive > 0 ? 'warn' : 'info',
      text: `Partner inactive count ${overview.inactive}`,
      domain: 'activation',
    });
  }
  if (force || overview.renewed === 0) {
    candidates.push({
      key: 'partners_renewal_needed',
      level: overview.renewed === 0 ? 'warn' : 'info',
      text: `Partner renewed rows ${overview.renewed}`,
      domain: 'renewal',
    });
  }
  if (force || overview.channelDeals === 0) {
    candidates.push({
      key: 'partners_channel_deal_seed',
      level: 'info',
      text: `Partner channel deals ${overview.channelDeals}`,
      domain: 'deal',
    });
  }
  for (const candidate of candidates) {
    const flag = addPartnersFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `partners sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pas'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('partners-sweeps', sweep, 80);
  appendAudit({ actor, action: 'partners.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: partnersSummary() };
}

export function ackPartnersFlag(input = {}, actor = 'system') {
  const list = readCollection('partners-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('partners-flags', list);
  appendAudit({ actor, action: 'partners.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: partnersSummary() };
}

export function markPartnersInactive(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.name && x.name === input.name));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isInactivePartner(x));
  if (idx < 0) return { ok: false, error: 'Inactive yapilacak partner yok' };
  list[idx] = {
    ...list[idx],
    status: 'inactive',
    inactive: true,
    inactiveReason: input.reason || input.inactiveReason || 'no_recent_pickup',
    inactiveAt: input.inactiveAt || new Date().toISOString(),
    inactiveBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('partner-hotels', list);
  appendAudit({ actor, action: 'partners.inactive', detail: list[idx].name || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, partner: list[idx], overview: partnersSummary() };
}

export function renewPartner(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.name && x.name === input.name));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isInactivePartner(x) || x.status === 'active');
  if (idx < 0) {
    const partner = createPartners({
      name: input.name || 'Wave 175 Renewed Partner',
      contact: input.contact || 'partner@example.com',
      status: 'renewed',
      channel: input.channel || 'b2b',
    }, actor);
    return { ok: true, partner, overview: partnersSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'renewed',
    inactive: false,
    renewed: true,
    renewalTerm: input.renewalTerm || input.term || '2026 season',
    renewedAt: input.renewedAt || new Date().toISOString(),
    renewedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('partner-hotels', list);
  appendAudit({ actor, action: 'partners.renew', detail: list[idx].name || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, partner: list[idx], overview: partnersSummary() };
}

export function seedChannelDeal(input = {}, actor = 'system') {
  const partner = createPartners(
    {
      name: input.name || 'Wave 175 Channel Deal',
      contact: input.contact || 'channel@example.com',
      channel: input.channel || 'tour_operator',
      rateCode: input.rateCode || 'W175-B2B',
      dealType: 'channel_deal',
      channelDeal: true,
      status: input.status || 'active',
    },
    actor,
  );
  appendAudit({ actor, action: 'partners.seed_channel_deal', detail: partner.name, meta: { id: partner.id } });
  return { ok: true, partner, overview: partnersSummary() };
}
