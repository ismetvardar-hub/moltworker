/**
 * AŞAMA 17 — Misafir CRM (pass + WhatsApp + geçiş birleşimi).
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { listHolders, listAccessEvents } from './pass.js';
import { appendAudit } from './audit.js';

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
  return {
    total: guests.length,
    withPass: guests.filter((g) => g.passId).length,
    withPhone: guests.filter((g) => g.phone).length,
    guests: guests.slice(0, 100),
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
