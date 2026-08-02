/**
 * AŞAMA 17 — Misafir CRM (pass + WhatsApp + geçiş birleşimi).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { listHolders, listAccessEvents } from './pass.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensureGuestsFromPass() {
  const existing = readCollection('guests', []);
  const byPhone = new Map(existing.map((g) => [g.phone || g.id, g]));
  const byPass = new Map(existing.filter((g) => g.passId).map((g) => [g.passId, g]));

  for (const h of listHolders()) {
    if (byPass.has(h.id)) continue;
    const guest = {
      id: `gst_${h.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      name: h.name,
      phone: null,
      email: null,
      passId: h.id,
      tier: h.tier,
      brandIds: ['brand_olympospass', 'brand_daze'],
      tags: ['pass-holder', h.tier],
      notes: '',
      createdAt: new Date().toISOString(),
      source: 'pass-seed',
    };
    existing.unshift(guest);
    byPass.set(h.id, guest);
  }

  // WhatsApp logundan telefon eşle
  const wa = readCollection('whatsapp', []);
  for (const m of wa) {
    if (!m.guest && !m.to) continue;
    const phone = m.to && m.to !== 'default' ? m.to : null;
    let g =
      (phone && [...byPhone.values()].find((x) => x.phone === phone)) ||
      existing.find(
        (x) =>
          m.guest &&
          x.name &&
          x.name.toLowerCase().startsWith(String(m.guest).toLowerCase().slice(0, 4)),
      );
    if (!g && (m.guest || phone)) {
      g = {
        id: `gst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
        name: m.guest || phone || 'Misafir',
        phone,
        email: null,
        passId: null,
        tier: null,
        brandIds: ['brand_daze'],
        tags: ['whatsapp'],
        notes: '',
        createdAt: m.at || new Date().toISOString(),
        source: 'whatsapp',
      };
      existing.unshift(g);
      if (phone) byPhone.set(phone, g);
    } else if (g && phone && !g.phone) {
      g.phone = phone;
    }
  }

  writeCollection('guests', existing.slice(0, 500));
  return existing.slice(0, 500);
}

export function listGuests() {
  const list = readCollection('guests', []);
  if (list.length === 0) return ensureGuestsFromPass();
  return list;
}

export function getGuest(id) {
  return listGuests().find((g) => g.id === id) ?? null;
}

export function upsertGuest(input, actor = 'system') {
  const guests = listGuests();
  if (input.id) {
    const idx = guests.findIndex((g) => g.id === input.id);
    if (idx >= 0) {
      guests[idx] = {
        ...guests[idx],
        ...input,
        id: input.id,
        updatedAt: new Date().toISOString(),
      };
      writeCollection('guests', guests);
      appendAudit({
        actor,
        action: 'guests.update',
        detail: guests[idx].name,
        meta: { id: input.id },
      });
      return guests[idx];
    }
  }
  const guest = {
    id: `gst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || 'Misafir').trim(),
    phone: input.phone || null,
    email: input.email || null,
    passId: input.passId || null,
    tier: input.tier || null,
    brandIds: Array.isArray(input.brandIds) ? input.brandIds : ['brand_daze'],
    tags: Array.isArray(input.tags) ? input.tags : [],
    notes: input.notes || '',
    createdAt: new Date().toISOString(),
    source: 'manual',
  };
  prependItem('guests', guest, 500);
  appendAudit({
    actor,
    action: 'guests.create',
    detail: guest.name,
    meta: { id: guest.id },
  });
  return guest;
}

export function guestTimeline(id) {
  const guest = getGuest(id);
  if (!guest) return null;
  const wa = readCollection('whatsapp', []).filter(
    (m) =>
      (guest.phone && m.to === guest.phone) ||
      (guest.name &&
        m.guest &&
        String(m.guest).toLowerCase().includes(guest.name.split(' ')[0].toLowerCase())),
  );
  const access = listAccessEvents(200).filter(
    (e) =>
      (guest.passId && e.holderId === guest.passId) ||
      (guest.name && e.holderName === guest.name),
  );
  const timeline = [
    ...wa.map((m) => ({
      at: m.at,
      kind: 'whatsapp',
      title: m.kind || 'whatsapp',
      detail: m.body,
      meta: { provider: m.provider, status: m.status },
    })),
    ...access.map((e) => ({
      at: e.at,
      kind: e.allowed ? 'pass.admit' : 'pass.deny',
      title: e.gateName,
      detail: e.reason,
      meta: { code: e.code },
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  return { guest, timeline, counts: { whatsapp: wa.length, access: access.length } };
}

export function guestsSummary() {
  const guests = listGuests();
  const missingPhone = guests.filter((g) => !g.phone).length;
  const missingPass = guests.filter((g) => !g.passId).length;
  const flags = readCollection('guests-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA Misafir CRM',
    generatedAt: new Date().toISOString(),
    total: guests.length,
    withPass: guests.filter((g) => g.passId).length,
    withPhone: guests.filter((g) => g.phone).length,
    guests: guests.slice(0, 100),
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: guests.length,
      with_pass: guests.filter((g) => g.passId).length,
      with_phone: guests.filter((g) => g.phone).length,
      missing_phone: missingPhone,
      missing_pass: missingPass,
    },
    summaryLines: [
      `${guests.length} misafir · pass ${guests.filter((g) => g.passId).length} · telefon ${guests.filter((g) => g.phone).length}`,
      `Eksik telefon ${missingPhone} · eksik pass ${missingPass} · flag ${openFlags.length}`,
    ],
  };
}

/** Seed / senkron tetikle */
export function syncGuestsFromSources(actor = 'system') {
  const guests = ensureGuestsFromPass();
  appendAudit({
    actor,
    action: 'guests.sync',
    detail: `${guests.length} misafir senkron`,
  });
  return guestsSummary();
}

export function runGuestsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = guestsSummary();
  const existing = readCollection('guests-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.missing_phone || 0) > 0) {
    candidates.push({
      key: 'missing_phone',
      level: 'warn',
      text: `Telefonsuz misafir ${o.summary?.missing_phone || 0}`,
      domain: 'phone',
    });
  }
  if (force || (o.summary?.missing_pass || 0) > 0) {
    candidates.push({
      key: 'missing_pass',
      level: 'info',
      text: `Passsiz misafir ${o.summary?.missing_pass || 0}`,
      domain: 'pass',
    });
  }
  if (force || (o.summary?.total || 0) < 2) {
    candidates.push({
      key: 'volume',
      level: 'info',
      text: `CRM hacmi ${o.summary?.total || 0}`,
      domain: 'volume',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Guests heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('gstf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('guests-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `guests sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('gsts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('guests-sweeps', sweep, 80);
  appendAudit({ actor, action: 'guests.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: guestsSummary() };
}

export function ackGuestsFlag(input = {}, actor = 'system') {
  const list = readCollection('guests-flags', []) || [];
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
  writeCollection('guests-flags', list);
  appendAudit({ actor, action: 'guests.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: guestsSummary() };
}

export function upsertGuestOps(input = {}, actor = 'system') {
  const guest = upsertGuest(
    {
      id: input.id,
      name: input.name || 'Ops Misafir',
      phone: input.phone || `+90555${String(Date.now()).slice(-7)}`,
      email: input.email || null,
      passId: input.passId || null,
      tier: input.tier || 'Standart',
      tags: input.tags || ['ops'],
      notes: input.notes || 'guest upsert ops',
    },
    actor,
  );
  appendAudit({ actor, action: 'guests.upsert_ops', detail: guest.name, meta: { id: guest.id } });
  return { ok: true, guest, overview: guestsSummary() };
}

export function syncGuestsOps(input = {}, actor = 'system') {
  const overview = syncGuestsFromSources(actor);
  const note = String(input.note || 'ops sync').slice(0, 240);
  const row = {
    id: rid('gstx'),
    at: new Date().toISOString(),
    actor,
    note,
    total: overview.total,
    withPass: overview.withPass,
    withPhone: overview.withPhone,
  };
  prependItem('guests-syncs', row, 80);
  appendAudit({ actor, action: 'guests.sync_ops', detail: `${overview.total}`, meta: { id: row.id } });
  return { ok: true, sync: row, overview: guestsSummary() };
}
