/**
 * AŞAMA 64 — Paket / Teslimat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const MINUTE_MS = 60_000;
const ACTIVE_STATUSES = new Set(['pending', 'preparing', 'ready', 'dispatched', 'enroute']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('delivery-orders', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [
      {
        id: 'del_1',
        guestName: 'Mert A.',
        items: 'Köfte menü x2',
        status: 'preparing',
        venueId: 'venue_kaleici',
        etaMin: 25,
        etaAt: new Date(now.getTime() + 25 * MINUTE_MS).toISOString(),
        at: now.toISOString(),
      },
    ];
    writeCollection('delivery-orders', seed);
    return seed;
  }
  return list;
}

function isLate(order) {
  if (!ACTIVE_STATUSES.has(order.status)) return false;
  const etaAt = Date.parse(order.etaAt || '');
  if (Number.isFinite(etaAt)) return etaAt < Date.now();
  const started = Date.parse(order.at || order.createdAt || '');
  const etaMin = Number(order.etaMin || 0);
  return Number.isFinite(started) && etaMin > 0 && started + etaMin * MINUTE_MS < Date.now();
}

function openDeliveryFlags() {
  const flags = readCollection('delivery-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addDeliveryFlag(candidate, actor = 'system') {
  const existing = readCollection('delivery-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('dlf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('delivery-flags', list.slice(0, 200));
  return flag;
}

export function listDelivery(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createDelivery(input = {}, actor = 'system') {
  const etaMin = Number(input.etaMin ?? 25) || 25;
  const now = new Date();
  const row = {
    id: `del_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : 'Misafir',
    items: input.items !== undefined ? input.items : 'Ayran x2',
    venueId: input.venueId || 'venue_kaleici',
    status: input.status || 'preparing',
    etaMin,
    etaAt: input.etaAt || new Date(now.getTime() + etaMin * MINUTE_MS).toISOString(),
    channel: input.channel || 'takeaway',
    at: input.at || now.toISOString(),
    createdBy: actor,
  };
  prependItem('delivery-orders', row, 300);
  appendAudit({ actor, action: 'delivery.create', detail: String(row.guestName || row.items || row.id), meta: { id: row.id } });
  return row;
}

export function updateDelivery(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.etaMin !== undefined) next.etaMin = Number(next.etaMin) || 0;
  list[idx] = next;
  writeCollection('delivery-orders', list);
  appendAudit({ actor, action: 'delivery.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function deliverySummary() {
  const list = listDelivery();
  const late = list.filter(isLate);
  const flags = openDeliveryFlags();
  return {
    title: 'LİKYA Paket Servis Ops',
    total: list.length,
    preparing: list.filter((x) => x.status === 'preparing').length,
    ready: list.filter((x) => x.status === 'ready').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    pending: list.filter((x) => x.status === 'pending').length,
    lateEta: late.length,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
      preparing: list.filter((x) => x.status === 'preparing').length,
      ready: list.filter((x) => x.status === 'ready').length,
      late_eta: late.length,
      delivered: list.filter((x) => x.status === 'delivered').length,
    },
    summaryLines: [
      `Paket ${list.length} · aktif ${list.filter((x) => ACTIVE_STATUSES.has(x.status)).length} · geç ETA ${late.length}`,
      `Hazır ${list.filter((x) => x.status === 'ready').length} · teslim ${list.filter((x) => x.status === 'delivered').length} · flag ${flags.length}`,
    ],
    orders: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runDeliverySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = deliverySummary();
  const created = [];
  const candidates = [];
  if (force || overview.lateEta > 0) {
    candidates.push({
      key: 'delivery_late_eta',
      level: overview.lateEta > 0 ? 'alert' : 'info',
      text: `Geç kalan paket ETA ${overview.lateEta}`,
      domain: 'eta',
    });
  }
  if (force || overview.pending > 0) {
    candidates.push({
      key: 'delivery_pending_queue',
      level: overview.pending > 0 ? 'warn' : 'info',
      text: `Bekleyen paket sipariş ${overview.pending}`,
      domain: 'queue',
    });
  }
  if (force || overview.ready > 0) {
    candidates.push({
      key: 'delivery_ready_not_delivered',
      level: overview.ready > 0 ? 'warn' : 'info',
      text: `Teslim bekleyen hazır paket ${overview.ready}`,
      domain: 'handoff',
    });
  }
  for (const candidate of candidates) {
    const flag = addDeliveryFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HERMES-SALES',
        title: `delivery sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('dls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('delivery-sweeps', sweep, 80);
  appendAudit({ actor, action: 'delivery.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: deliverySummary() };
}

export function ackDeliveryFlag(input = {}, actor = 'system') {
  const list = readCollection('delivery-flags', []) || [];
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
  writeCollection('delivery-flags', list);
  appendAudit({ actor, action: 'delivery.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: deliverySummary() };
}

export function markDeliveryDelivered(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id) >= 0
    ? list.findIndex((x) => x.id === input.id)
    : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Teslim edilecek paket yok' };
  list[idx] = {
    ...list[idx],
    status: 'delivered',
    deliveredAt: input.deliveredAt || new Date().toISOString(),
    deliveredBy: actor,
    courier: input.courier || list[idx].courier || 'Ops courier',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('delivery-orders', list);
  appendAudit({ actor, action: 'delivery.delivered', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, order: list[idx], overview: deliverySummary() };
}

export function delayDeliveryEta(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id) >= 0
    ? list.findIndex((x) => x.id === input.id)
    : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'ETA güncellenecek paket yok' };
  const minutes = Number(input.minutes ?? 15) || 15;
  const currentEta = Date.parse(list[idx].etaAt || '') || Date.now();
  list[idx] = {
    ...list[idx],
    etaMin: Number(list[idx].etaMin || 0) + minutes,
    etaAt: new Date(currentEta + minutes * MINUTE_MS).toISOString(),
    note: input.note || list[idx].note || 'Ops ETA gecikme',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('delivery-orders', list);
  appendAudit({ actor, action: 'delivery.delay_eta', detail: `${list[idx].guestName || list[idx].id} +${minutes} dk`, meta: { id: list[idx].id } });
  return { ok: true, order: list[idx], overview: deliverySummary() };
}

export function seedPendingDelivery(input = {}, actor = 'system') {
  const late = input.late !== false;
  const order = createDelivery(
    {
      guestName: input.guestName || 'Ops pending guest',
      items: input.items || 'Rush burger x1',
      venueId: input.venueId || 'venue_kaleici',
      status: input.status || 'pending',
      etaMin: Number(input.etaMin ?? 10),
      etaAt: input.etaAt || new Date(Date.now() + (late ? -10 : 10) * MINUTE_MS).toISOString(),
      channel: input.channel || 'ops-seed',
    },
    actor,
  );
  appendAudit({ actor, action: 'delivery.seed_pending', detail: order.guestName, meta: { id: order.id } });
  return { ok: true, order, overview: deliverySummary() };
}
