/**
 * AŞAMA 330 — Vanguard (Nexus Prime) checkpoint.
 * Cognisphere + omni-kanal / otonom ticaret sinyalleri.
 */
import { buildCognisphere } from './cognisphere.js';
import { createPosbridge, listPosbridge, posbridgeSummary, updatePosbridge } from './posbridge.js';
import { createDynamint, dynamintSummary, listDynamint, updateDynamint } from './dynamint.js';
import { couriertrackSummary } from './couriertrack.js';
import { autocheckoutSummary } from './autocheckout.js';
import { loyaltyburnSummary } from './loyaltyburn.js';
import { lastmileSummary } from './lastmile.js';
import { createInvsync, invsyncSummary, listInvsync, updateInvsync } from './invsync.js';
import { createQrpay, listQrpay, qrpaySummary, updateQrpay } from './qrpay.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildVanguard() {
  const cog = buildCognisphere();
  const pos = posbridgeSummary();
  const mint = dynamintSummary();
  const courier = couriertrackSummary();
  const checkout = autocheckoutSummary();
  const burn = loyaltyburnSummary();
  const mile = lastmileSummary();
  const sync = invsyncSummary();
  const qr = qrpaySummary();
  const flags = readCollection('vanguard-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Vanguard · Nexus Prime',
    subtitle: 'Omni-Channel Operations & Autonomous Commerce',
    cognisphere: { summaryLines: (cog.summaryLines || []).slice(0, 2) },
    posOnline: pos.online || 0,
    posOffline: pos.offline || 0,
    mintQueued: mint.queued || 0,
    mintPushed: mint.pushed || 0,
    courierEnroute: courier.enroute || 0,
    checkoutOpen: checkout.open || 0,
    loyaltyPending: burn.pending || 0,
    lastmileQueued: mile.queued || 0,
    invDrift: sync.drift || 0,
    qrPending: qr.pending || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      flags_acked: flagList.filter((f) => f.status === 'acked').length,
      pos_offline: pos.offline || 0,
      mint_queued: mint.queued || 0,
      inv_drift: sync.drift || 0,
      qr_pending: qr.pending || 0,
    },
    summaryLines: [
      ...(cog.summaryLines || []).slice(0, 2),
      `POS online ${pos.online || 0} / offline ${pos.offline || 0}`,
      `MINT push kuyruk ${mint.queued || 0} · yayında ${mint.pushed || 0}`,
      `Kurye enroute ${courier.enroute || 0} · Last-mile kuyruk ${mile.queued || 0}`,
      `Otonom checkout açık ${checkout.open || 0} · QR pay bekleyen ${qr.pending || 0}`,
      `Sadakat burn pending ${burn.pending || 0} · Stok drift ${sync.drift || 0}`,
      `Vanguard flag ${openFlags.length} açık`,
    ],
  };
}

/** Omni-kanal sinyallerinden flag üret */
export function runVanguardSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const vg = buildVanguard();
  const existing = readCollection('vanguard-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (vg.posOffline || 0) > 0) {
    candidates.push({ key: 'pos_offline', level: 'alert', text: `POS offline ${vg.posOffline || 0}`, domain: 'pos' });
  }
  if (force || (vg.mintQueued || 0) > 2) {
    candidates.push({ key: 'mint_queue', level: 'warn', text: `MINT kuyruk ${vg.mintQueued || 0}`, domain: 'mint' });
  }
  if (force || (vg.invDrift || 0) > 0) {
    candidates.push({ key: 'inv_drift', level: 'warn', text: `Stok drift ${vg.invDrift || 0}`, domain: 'inv' });
  }
  if (force || (vg.qrPending || 0) > 0) {
    candidates.push({ key: 'qr_pending', level: 'info', text: `QR pay pending ${vg.qrPending || 0}`, domain: 'qr' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Vanguard heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('vgf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('vanguard-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'MINT',
        title: `vanguard sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('vgs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('vanguard-sweeps', sweep, 80);
  appendAudit({ actor, action: 'vanguard.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildVanguard() };
}

export function ackVanguardFlag(input = {}, actor = 'system') {
  const list = readCollection('vanguard-flags', []) || [];
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
  writeCollection('vanguard-flags', list);
  appendAudit({ actor, action: 'vanguard.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildVanguard() };
}

/** Offline POS terminali online yap / seed */
export function forceVanguardPosOnline(input = {}, actor = 'system') {
  const terminals = listPosbridge();
  const offline = terminals.filter((t) => t.status === 'offline');
  const updated = [];
  for (const t of offline.slice(0, Number(input.limit) || 10)) {
    if (input.id && t.id !== input.id) continue;
    const next = updatePosbridge(t.id, { status: 'online', forced_by: actor }, actor);
    if (next) updated.push(next.id);
  }
  if (!updated.length) {
    const seeded = createPosbridge({ terminal: input.terminal || 'VG-POS-1', status: 'online' }, actor);
    updated.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `POS force-online · ${updated.length}`,
      priority: 'high',
      payload: { ids: updated },
    },
    actor,
  );
  appendAudit({ actor, action: 'vanguard.pos_online', detail: `${updated.length} terminal`, meta: { n: updated.length } });
  return { ok: true, updated, overview: buildVanguard() };
}

/** Stok drift kayıtlarını sync/ok yap */
export function clearVanguardInvDrift(input = {}, actor = 'system') {
  const list = listInvsync();
  const cleared = [];
  for (const row of list) {
    if (row.status !== 'drift' && !input.force) continue;
    if (input.id && row.id !== input.id) continue;
    const next = updateInvsync(row.id, { status: 'synced', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createInvsync({ sku: input.sku || 'VG-SKU', status: 'synced', delta: 0 }, actor);
    cleared.push(seeded.id);
  }
  const flags = readCollection('vanguard-flags', []) || [];
  if (Array.isArray(flags)) {
    for (let i = 0; i < flags.length; i++) {
      if (flags[i].domain === 'inv' && flags[i].status === 'open') {
        flags[i] = { ...flags[i], status: 'acked', acked_at: new Date().toISOString(), acked_by: actor, note: 'inv cleared' };
      }
    }
    writeCollection('vanguard-flags', flags);
  }
  appendAudit({ actor, action: 'vanguard.inv_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildVanguard() };
}

/** MINT kuyruğunu push / flush */
export function flushVanguardMintQueue(input = {}, actor = 'system') {
  const list = listDynamint();
  const flushed = [];
  for (const row of list.filter((r) => r.status === 'queued' || r.status === 'pending').slice(0, Number(input.limit) || 20)) {
    const next = updateDynamint(row.id, { status: 'pushed', flushed_by: actor }, actor);
    if (next) flushed.push(next.id);
  }
  if (!flushed.length) {
    const seeded = createDynamint({ sku: input.sku || 'Pass-Day', status: 'pushed' }, actor);
    flushed.push(seeded.id);
  }
  // QR pending temizliği (opsiyonel yan etki)
  if (input.clear_qr) {
    for (const q of listQrpay().filter((x) => x.status === 'pending').slice(0, 10)) {
      updateQrpay(q.id, { status: 'paid' }, actor);
    }
  } else if (!listQrpay().length) {
    createQrpay({ amount: 1, status: 'paid' }, actor);
  }
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `mint flush · ${flushed.length}`,
      priority: 'normal',
      payload: { ids: flushed },
    },
    actor,
  );
  appendAudit({ actor, action: 'vanguard.mint_flush', detail: `${flushed.length}`, meta: { n: flushed.length } });
  return { ok: true, flushed, overview: buildVanguard() };
}
