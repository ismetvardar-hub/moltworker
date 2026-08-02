/**
 * AŞAMA 71 — Sözleşme Yenileme.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const DAY_MS = 24 * 60 * 60_000;

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('contracts', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'ctr_1',
        title: 'NEXUS bakım',
        vendor: 'NEXUS Tags TR',
        renewAt: '2026-09-01',
        signed: true,
        signedAt: '2025-09-01T09:00:00.000Z',
        status: 'active',
      },
    ];
    writeCollection('contracts', seed);
    return seed;
  }
  return list;
}

function daysUntil(value) {
  const t = Date.parse(value || '');
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / DAY_MS);
}

function isUnsigned(contract) {
  return contract.status !== 'expired' && contract.signed !== true && !contract.signedAt;
}

function openContractsFlags() {
  const flags = readCollection('contracts-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addContractsFlag(candidate, actor = 'system') {
  const existing = readCollection('contracts-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('ctf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('contracts-flags', list.slice(0, 200));
  return flag;
}

export function listContracts(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(a.renewAt || '').localeCompare(String(b.renewAt || '')));
}

export function createContracts(input = {}, actor = 'system') {
  const row = {
    id: `con_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : 'Sözleşme',
    vendor: input.vendor !== undefined ? input.vendor : 'Firma',
    renewAt: input.renewAt !== undefined ? input.renewAt : '2026-12-01',
    status: input.status || 'active',
    signed: input.signed === true,
    signedAt: input.signedAt || null,
    autoRenew: input.autoRenew === true,
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('contracts', row, 300);
  appendAudit({ actor, action: 'contracts.create', detail: String(row.title || row.vendor || row.id), meta: { id: row.id } });
  return row;
}

export function updateContracts(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('contracts', list);
  appendAudit({ actor, action: 'contracts.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function contractsSummary() {
  const list = listContracts();
  const horizonDays = 45;
  const expiringSoon = list.filter((x) => {
    const d = daysUntil(x.renewAt);
    return x.status !== 'expired' && d != null && d >= 0 && d <= horizonDays;
  });
  const overdueRenewal = list.filter((x) => {
    const d = daysUntil(x.renewAt);
    return x.status !== 'expired' && d != null && d < 0;
  });
  const unsigned = list.filter(isUnsigned);
  const flags = openContractsFlags();
  return {
    title: 'LİKYA Sözleşme Ops',
    total: list.length,
    active: list.filter((x) => x.status === 'active').length,
    renewing: list.filter((x) => x.status === 'renewing').length,
    expired: list.filter((x) => x.status === 'expired').length,
    expiringSoon: expiringSoon.length,
    unsigned: unsigned.length,
    overdueRenewal: overdueRenewal.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => x.status === 'active').length,
      renewing: list.filter((x) => x.status === 'renewing').length,
      expiring_soon: expiringSoon.length,
      unsigned: unsigned.length,
      overdue_renewal: overdueRenewal.length,
    },
    summaryLines: [
      `Sözleşme ${list.length} · yenileme ${expiringSoon.length} · overdue ${overdueRenewal.length}`,
      `İmza bekleyen ${unsigned.length} · flag ${flags.length}`,
    ],
    contracts: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runContractsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = contractsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.expiringSoon > 0) {
    candidates.push({
      key: 'contracts_expiring_soon',
      level: overview.expiringSoon > 0 ? 'warn' : 'info',
      text: `Yaklaşan sözleşme yenileme ${overview.expiringSoon}`,
      domain: 'renewal',
    });
  }
  if (force || overview.unsigned > 0) {
    candidates.push({
      key: 'contracts_unsigned',
      level: overview.unsigned > 0 ? 'alert' : 'info',
      text: `İmza bekleyen sözleşme ${overview.unsigned}`,
      domain: 'signature',
    });
  }
  if (force || overview.overdueRenewal > 0) {
    candidates.push({
      key: 'contracts_overdue_renewal',
      level: overview.overdueRenewal > 0 ? 'alert' : 'info',
      text: `Gecikmiş yenileme ${overview.overdueRenewal}`,
      domain: 'renewal',
    });
  }
  for (const candidate of candidates) {
    const flag = addContractsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'THEMIS',
        title: `contracts sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('contracts-sweeps', sweep, 80);
  appendAudit({ actor, action: 'contracts.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: contractsSummary() };
}

export function ackContractsFlag(input = {}, actor = 'system') {
  const list = readCollection('contracts-flags', []) || [];
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
  writeCollection('contracts-flags', list);
  appendAudit({ actor, action: 'contracts.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: contractsSummary() };
}

export function signContractOps(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id) >= 0
    ? list.findIndex((x) => x.id === input.id)
    : list.findIndex(isUnsigned);
  if (idx < 0) return { ok: false, error: 'İmza bekleyen sözleşme yok' };
  list[idx] = {
    ...list[idx],
    signed: true,
    signedAt: input.signedAt || new Date().toISOString(),
    signedBy: actor,
    status: input.status || (list[idx].status === 'expired' ? 'renewing' : list[idx].status),
    updatedAt: new Date().toISOString(),
  };
  writeCollection('contracts', list);
  appendAudit({ actor, action: 'contracts.sign', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, contract: list[idx], overview: contractsSummary() };
}

export function renewContractOps(input = {}, actor = 'system') {
  const list = ensure();
  const candidates = list
    .map((contract, idx) => ({ contract, idx, days: daysUntil(contract.renewAt) }))
    .filter((x) => x.contract.status !== 'expired')
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : candidates[0]?.idx ?? -1;
  if (idx < 0) return { ok: false, error: 'Sözleşme yok' };
  const months = Number(input.months ?? 12) || 12;
  const base = Math.max(Date.parse(list[idx].renewAt || '') || Date.now(), Date.now());
  const renewAt = input.renewAt || new Date(base + Math.round(months * 30.4 * DAY_MS)).toISOString().slice(0, 10);
  list[idx] = {
    ...list[idx],
    renewAt,
    status: 'active',
    renewalCount: Number(list[idx].renewalCount || 0) + 1,
    renewedAt: new Date().toISOString(),
    renewedBy: actor,
    note: input.note || list[idx].note || 'Ops yenileme tamamlandı',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('contracts', list);
  appendAudit({ actor, action: 'contracts.renew', detail: `${list[idx].title || list[idx].id} → ${renewAt}`, meta: { id: list[idx].id } });
  return { ok: true, contract: list[idx], overview: contractsSummary() };
}

export function seedRenewingContract(input = {}, actor = 'system') {
  const days = Number(input.days ?? 14);
  const contract = createContracts(
    {
      title: input.title || 'Ops yenileme sözleşmesi',
      vendor: input.vendor || 'Ops Vendor',
      renewAt: input.renewAt || new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10),
      status: input.status || 'renewing',
      signed: input.signed === true,
      autoRenew: input.autoRenew === true,
    },
    actor,
  );
  appendAudit({ actor, action: 'contracts.seed_renewing', detail: contract.title, meta: { id: contract.id } });
  return { ok: true, contract, overview: contractsSummary() };
}
