/**
 * AŞAMA 93 — Misafir Hesap.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('folio', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'fol_1',
      guestName: "Misafir",
      charge: "Spa",
      amount: "250",
      status: 'open',
      at: new Date().toISOString(),
    }];
    writeCollection('folio', seed);
    return seed;
  }
  return list;
}

function openFolioFlags() {
  const flags = readCollection('folio-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addFolioFlag(candidate, actor = 'system') {
  const existing = readCollection('folio-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('fof'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('folio-flags', list.slice(0, 200));
  return flag;
}

export function listFolio(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createFolio(input = {}, actor = 'system') {
  const amount = input.amount !== undefined ? Number(input.amount) || 0 : 250;
  const row = {
    id: `fol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    charge: input.charge !== undefined ? input.charge : "Spa",
    amount,
    balance: input.balance !== undefined ? Number(input.balance) || 0 : amount,
    room: input.room || null,
    disputeReason: input.disputeReason || null,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('folio', row, 300);
  appendAudit({
    actor,
    action: 'folio.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFolio(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.amount !== undefined) next.amount = Number(next.amount) || 0;
  if (next.balance !== undefined) next.balance = Number(next.balance) || 0;
  list[idx] = next;
  writeCollection('folio', list);
  appendAudit({ actor, action: 'folio.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function folioSummary() {
  const list = listFolio();
  const unpaid = list.filter((x) => !['closed', 'paid', 'void'].includes(x.status) && Number(x.balance ?? x.amount ?? 0) > 0);
  const disputes = list.filter((x) => x.status === 'disputed' || x.disputeReason);
  const flags = openFolioFlags();
  return {
    title: 'LİKYA Folio Ops',
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    posted: list.filter((x) => x.status === 'posted').length,
    closed: list.filter((x) => x.status === 'closed').length,
    disputed: disputes.length,
    unpaid: unpaid.length,
    unpaidBalance: unpaid.reduce((sum, x) => sum + Number(x.balance ?? x.amount ?? 0), 0),
    postedBalance: list.filter((x) => x.status === 'posted').reduce((sum, x) => sum + Number(x.balance ?? x.amount ?? 0), 0),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      open: list.filter((x) => x.status === 'open').length,
      posted: list.filter((x) => x.status === 'posted').length,
      closed: list.filter((x) => x.status === 'closed').length,
      disputed: disputes.length,
      unpaid: unpaid.length,
      unpaid_balance: unpaid.reduce((sum, x) => sum + Number(x.balance ?? x.amount ?? 0), 0),
    },
    summaryLines: [
      `Folio ${list.length} · unpaid ${unpaid.length} · balance ${unpaid.reduce((sum, x) => sum + Number(x.balance ?? x.amount ?? 0), 0)} TRY`,
      `Posted ${list.filter((x) => x.status === 'posted').length} · dispute ${disputes.length} · flag ${flags.length}`,
    ],
    folio: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runFolioSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = folioSummary();
  const created = [];
  const candidates = [];
  if (force || overview.unpaidBalance > 0) {
    candidates.push({
      key: 'folio_unpaid_balance',
      level: overview.unpaidBalance > 0 ? 'warn' : 'info',
      text: `Ödenmemiş folio bakiye ${overview.unpaidBalance} TRY`,
      domain: 'balance',
    });
  }
  if (force || overview.disputed > 0) {
    candidates.push({
      key: 'folio_disputes_open',
      level: overview.disputed > 0 ? 'alert' : 'info',
      text: `Açık folio dispute ${overview.disputed}`,
      domain: 'dispute',
    });
  }
  if (force || overview.open > 0) {
    candidates.push({
      key: 'folio_open_charges',
      level: overview.open > 0 ? 'warn' : 'info',
      text: `Post bekleyen folio charge ${overview.open}`,
      domain: 'posting',
    });
  }
  for (const candidate of candidates) {
    const flag = addFolioFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ATHENA-FIN',
        title: `folio sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('fos'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('folio-sweeps', sweep, 80);
  appendAudit({ actor, action: 'folio.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: folioSummary() };
}

export function ackFolioFlag(input = {}, actor = 'system') {
  const list = readCollection('folio-flags', []) || [];
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
  writeCollection('folio-flags', list);
  appendAudit({ actor, action: 'folio.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: folioSummary() };
}

export function postFolioCharge(input = {}, actor = 'system') {
  const explicitId = input.id;
  if (!explicitId && (input.guestName || input.charge || input.amount !== undefined)) {
    const charge = createFolio(
      {
        guestName: input.guestName || 'Ops folio guest',
        charge: input.charge || 'Ops charge',
        amount: Number(input.amount ?? 150),
        balance: Number(input.balance ?? input.amount ?? 150),
        room: input.room || '203',
        status: 'posted',
      },
      actor,
    );
    appendAudit({ actor, action: 'folio.post_charge', detail: charge.charge, meta: { id: charge.id } });
    return { ok: true, charge, overview: folioSummary() };
  }
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === explicitId);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'open');
  if (idx < 0) return { ok: false, error: 'Post edilecek folio charge yok' };
  list[idx] = {
    ...list[idx],
    status: 'posted',
    balance: Number(list[idx].balance ?? list[idx].amount ?? 0),
    postedAt: input.postedAt || new Date().toISOString(),
    postedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('folio', list);
  appendAudit({ actor, action: 'folio.post_charge', detail: list[idx].charge || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, charge: list[idx], overview: folioSummary() };
}

export function settleFolioBalance(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => Number(x.balance ?? x.amount ?? 0) > 0 && x.status !== 'closed');
  if (idx < 0) return { ok: false, error: 'Tahsil edilecek folio bakiyesi yok' };
  const amount = Number(input.amount ?? list[idx].balance ?? list[idx].amount ?? 0) || 0;
  const nextBalance = Math.max(0, Number(list[idx].balance ?? list[idx].amount ?? 0) - amount);
  list[idx] = {
    ...list[idx],
    balance: nextBalance,
    status: nextBalance <= 0 ? 'closed' : list[idx].status,
    settledAt: nextBalance <= 0 ? new Date().toISOString() : list[idx].settledAt,
    lastPaymentAt: new Date().toISOString(),
    lastPaymentBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('folio', list);
  appendAudit({ actor, action: 'folio.settle', detail: `${list[idx].guestName || list[idx].id} -${amount}`, meta: { id: list[idx].id } });
  return { ok: true, charge: list[idx], amount, overview: folioSummary() };
}

export function seedFolioDispute(input = {}, actor = 'system') {
  const charge = createFolio(
    {
      guestName: input.guestName || 'Ops dispute guest',
      charge: input.charge || 'Spa disputed charge',
      amount: Number(input.amount ?? 320),
      balance: Number(input.balance ?? input.amount ?? 320),
      room: input.room || '314',
      status: 'disputed',
      disputeReason: input.reason || 'Guest disputes charge',
    },
    actor,
  );
  appendAudit({ actor, action: 'folio.seed_dispute', detail: charge.guestName, meta: { id: charge.id } });
  return { ok: true, charge, overview: folioSummary() };
}
