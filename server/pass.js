/**
 * AŞAMA 13 — OlymposPass geçiş motoru.
 * Kart/QR kod doğrulama + tesis/kapı yetkisi + canlı geçiş günlüğü.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { listVenues } from './venues.js';

const DEFAULT_HOLDERS = [
  {
    id: 'OLP-7A21',
    name: 'Elif Kaya',
    tier: 'Platin',
    zones: ['Ana Kapı', 'VIP Salon', 'Marina', 'Teleferik', 'Plaj'],
    gateIds: ['gate-main', 'gate-vip', 'gate-beach'],
    venueIds: ['venue_olympos_beach', 'venue_kaleici'],
    active: true,
    lastEntryAt: null,
  },
  {
    id: 'OLP-3F08',
    name: 'Mert Demir',
    tier: 'Altın',
    zones: ['Ana Kapı', 'Marina', 'Plaj'],
    gateIds: ['gate-main', 'gate-beach'],
    venueIds: ['venue_olympos_beach'],
    active: true,
    lastEntryAt: null,
  },
  {
    id: 'OLP-9C44',
    name: 'Zeynep Arslan',
    tier: 'Gümüş',
    zones: ['Ana Kapı', 'Plaj'],
    gateIds: ['gate-main', 'gate-beach'],
    venueIds: ['venue_olympos_beach'],
    active: true,
    lastEntryAt: null,
  },
  {
    id: 'OLP-1B77',
    name: 'Can Yılmaz',
    tier: 'Standart',
    zones: ['Ana Kapı'],
    gateIds: ['gate-main'],
    venueIds: ['venue_olympos_beach'],
    active: false,
    lastEntryAt: null,
  },
];

const GATES = [
  {
    id: 'gate-main',
    name: 'Ana Kapı Turnike',
    zone: 'Ana Kapı',
    venueId: 'venue_olympos_beach',
    deviceId: 'gate-main',
  },
  {
    id: 'gate-beach',
    name: 'Plaj RFID',
    zone: 'Plaj',
    venueId: 'venue_olympos_beach',
    deviceId: 'gate-beach',
  },
  {
    id: 'gate-vip',
    name: 'VIP Salon Kapısı',
    zone: 'VIP Salon',
    venueId: 'venue_kaleici',
    deviceId: 'gate-vip',
  },
];

function ensureHolders() {
  const list = readCollection('pass-holders', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('pass-holders', DEFAULT_HOLDERS);
    return DEFAULT_HOLDERS;
  }
  return list;
}

export function listGates() {
  const venues = listVenues();
  return GATES.map((g) => ({
    ...g,
    venueName: venues.find((v) => v.id === g.venueId)?.name ?? g.venueId,
  }));
}

export function listHolders() {
  return ensureHolders();
}

export function listAccessEvents(limit = 40) {
  return readCollection('access-events', []).slice(0, limit);
}

function findHolder(code) {
  const normalized = String(code || '').trim().toUpperCase();
  return {
    normalized,
    holder: listHolders().find((h) => h.id === normalized) ?? null,
  };
}

/**
 * Doğrulama kararı — henüz geçiş yazmaz.
 */
export function verifyPass({ code, gateId }) {
  const { normalized, holder } = findHolder(code);
  const gate = GATES.find((g) => g.id === gateId) ?? null;

  if (!normalized) {
    return { allowed: false, reason: 'Kod boş', code: normalized, gate, holder: null };
  }
  if (!/^OLP-[A-Z0-9]{4}$/.test(normalized)) {
    return {
      allowed: false,
      reason: 'Kod biçimi geçersiz (OLP-XXXX)',
      code: normalized,
      gate,
      holder: null,
    };
  }
  if (!gate) {
    return { allowed: false, reason: 'Kapı seçilmedi veya geçersiz', code: normalized, gate: null, holder };
  }
  if (!holder) {
    return { allowed: false, reason: 'Kod sistemde kayıtlı değil', code: normalized, gate, holder: null };
  }
  if (!holder.active) {
    return {
      allowed: false,
      reason: `${holder.name} kartı pasif`,
      code: normalized,
      gate,
      holder,
    };
  }
  const gateOk =
    (holder.gateIds ?? []).includes(gate.id) ||
    (holder.zones ?? []).includes(gate.zone);
  const venueOk =
    !holder.venueIds?.length || holder.venueIds.includes(gate.venueId);
  if (!gateOk || !venueOk) {
    return {
      allowed: false,
      reason: `${holder.name} bu kapı/tesis için yetkili değil (${gate.name})`,
      code: normalized,
      gate,
      holder,
    };
  }
  return {
    allowed: true,
    reason: 'Geçiş onaylandı',
    code: normalized,
    gate,
    holder,
  };
}

/**
 * Doğrula + geçiş günlüğüne yaz + (opsiyonel) NEXUS pulse için deviceId döndür.
 */
export function admitPass({ code, gateId, actor = 'system' }) {
  const decision = verifyPass({ code, gateId });
  const event = {
    id: `acc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    at: new Date().toISOString(),
    code: decision.code,
    holderName: decision.holder?.name ?? 'Bilinmeyen',
    holderId: decision.holder?.id ?? null,
    gateId: decision.gate?.id ?? gateId ?? null,
    gateName: decision.gate?.name ?? '—',
    venueId: decision.gate?.venueId ?? null,
    zone: decision.gate?.zone ?? null,
    allowed: decision.allowed,
    reason: decision.reason,
    actor,
    nexusDeviceId: decision.allowed ? decision.gate?.deviceId ?? null : null,
  };
  prependItem('access-events', event, 300);

  if (decision.allowed && decision.holder) {
    const holders = listHolders().map((h) =>
      h.id === decision.holder.id
        ? { ...h, lastEntryAt: event.at, lastEntryGate: event.gateId }
        : h,
    );
    writeCollection('pass-holders', holders);
  }

  appendAudit({
    actor,
    action: decision.allowed ? 'pass.admit' : 'pass.deny',
    detail: `${event.holderName} @ ${event.gateName}: ${event.reason}`,
    meta: { code: event.code, gateId: event.gateId, allowed: event.allowed },
  });

  return { decision, event };
}

export function passStats() {
  const events = listAccessEvents(500);
  const allowed = events.filter((e) => e.allowed).length;
  const denied = events.filter((e) => !e.allowed).length;
  return {
    holders: listHolders().length,
    activeHolders: listHolders().filter((h) => h.active).length,
    gates: GATES.length,
    events: events.length,
    allowed,
    denied,
    allowRate: events.length ? Math.round((allowed / events.length) * 100) : null,
  };
}
