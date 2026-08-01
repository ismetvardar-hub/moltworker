/**
 * AŞAMA 585 — Vault checkpoint.
 */
import { buildBeacon } from './beacon.js';
import { createTreasury, listTreasury, treasurySummary, updateTreasury } from './treasury.js';
import { createApdesk, listApdesk, apdeskSummary, updateApdesk } from './apdesk.js';
import { createArdesk, listArdesk, ardeskSummary, updateArdesk } from './ardesk.js';
import { createPayout, listPayout, payoutSummary, updatePayout } from './payout.js';
import { createBankrecon, listBankrecon, bankreconSummary, updateBankrecon } from './bankrecon.js';
import { createClosebook, listClosebook, closebookSummary, updateClosebook } from './closebook.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildVault() {
  const prev = buildBeacon();
  const tres = treasurySummary();
  const ap = apdeskSummary();
  const ar = ardeskSummary();
  const pay = payoutSummary();
  const recon = bankreconSummary();
  const close = closebookSummary();
  const flags = readCollection('vault-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Vault',
    beacon: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    tresCritical: tres.critical || 0,
    apOpen: ap.open || 0,
    arOpen: ar.open || 0,
    payFailed: pay.failed || 0,
    reconException: recon.exception || 0,
    closeOpen: close.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      tres_critical: tres.critical || 0,
      ap_open: ap.open || 0,
      ar_open: ar.open || 0,
      pay_failed: pay.failed || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Treasury critical ${tres.critical || 0} · AP open ${ap.open || 0}`,
      `AR open ${ar.open || 0} · Payout failed ${pay.failed || 0}`,
      `Bank recon exceptions ${recon.exception || 0} · Close books open ${close.open || 0}`,
      `Vault flag ${openFlags.length} açık`,
    ],
  };
}

export function runVaultSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildVault();
  const existing = readCollection('vault-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.tresCritical || 0) > 0)) {
    candidates.push({ key: 'treasury', level: 'alert', text: `Treasury critical ${o.tresCritical || 0}`, domain: 'treasury' });
  }
  if (force || ((o.apOpen || 0) > 0 || (o.arOpen || 0) > 0)) {
    candidates.push({ key: 'desk', level: 'warn', text: `AP open ${o.apOpen || 0} · AR open ${o.arOpen || 0}`, domain: 'desk' });
  }
  if (force || ((o.payFailed || 0) > 0 || (o.reconException || 0) > 0 || (o.closeOpen || 0) > 0)) {
    candidates.push({ key: 'recon', level: 'info', text: `Payout failed ${o.payFailed || 0} · Recon ${o.reconException || 0}`, domain: 'recon' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Vault heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('vltf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('vault-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'PLUTUS', title: `vault sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('vlts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('vault-sweeps', sweep, 80);
  appendAudit({ actor, action: 'vault.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildVault() };
}

export function ackVaultFlag(input = {}, actor = 'system') {
  const list = readCollection('vault-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('vault-flags', list);
  appendAudit({ actor, action: 'vault.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildVault() };
}

export function healVaultTreasury(input = {}, actor = 'system') {
  const rows = listTreasury().filter((x) => x.status === 'critical' || x.status === 'tight');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTreasury(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createTreasury({ account: 'vault', balance: '1', status: 'ok' }, actor);
    healed.push(seeded.id);
  }
  appendAudit({ actor, action: 'vault.treasury_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildVault() };
}

export function closeVaultAp(input = {}, actor = 'system') {
  const rows = listApdesk().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateApdesk(row.id, { status: 'paid', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createApdesk({ vendor: 'vault', amount: '1', status: 'paid' }, actor);
    closed.push(seeded.id);
  }
  for (const a of listArdesk().filter((x) => x.status === 'open' || x.status === 'partial').slice(0, 5)) {
    updateArdesk(a.id, { status: 'collected', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'vault.ap_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildVault() };
}

export function clearVaultRecon(input = {}, actor = 'system') {
  const rows = listPayout().filter((x) => x.status === 'failed');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePayout(row.id, { status: 'sent', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createPayout({ payee: 'vault', amount: '1', status: 'sent' }, actor);
    cleared.push(seeded.id);
  }
  for (const r of listBankrecon().filter((x) => x.status === 'exception' || x.status === 'open').slice(0, 5)) {
    updateBankrecon(r.id, { status: 'matched', touched_by: actor }, actor);
  }
  for (const c of listClosebook().filter((x) => x.status === 'open' || x.status === 'review').slice(0, 5)) {
    updateClosebook(c.id, { status: 'closed', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'PLUTUS', title: `vault recon_clear · ${cleared.length}`, priority: 'normal', payload: { ids: cleared } }, actor);
  appendAudit({ actor, action: 'vault.recon_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildVault() };
}
