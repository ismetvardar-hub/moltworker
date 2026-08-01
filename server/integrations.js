/**
 * AŞAMA 3 — Dış dünya entegrasyonları (Vite middleware)
 *
 *  POST /api/whatsapp/send     → REMINDER-AI (Twilio / Meta Graph / mock)
 *  GET  /api/mint/demand       → MINT canlı talep yoğunluğu matrisi
 *  GET  /api/nexus/devices     → NEXUS cihaz envanteri
 *  POST /api/nexus/command     → NEXUS turnike/kapı röle komutu
 *  GET  /api/nexus/events      → NEXUS olay günlüğü
 */

import { URL } from 'node:url';
import {
  persistWhatsapp,
  persistNexusEvent,
  readWhatsapp,
  readNexusEvents,
} from './platform.js';

// ─── Ortak yardımcılar ────────────────────────────────────────────────

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

// ─── REMINDER-AI / WhatsApp ───────────────────────────────────────────

let messageLog = readWhatsapp();

async function sendViaTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // örn: whatsapp:+14155238886
  if (!sid || !token || !from) return null;

  const dest = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: dest, From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Twilio HTTP ${res.status}`);
  return { provider: 'twilio', sid: data.sid, status: data.status ?? 'queued' };
}

async function sendViaMeta(to, body) {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return null;

  const digits = to.replace(/\D/g, '');
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: digits,
      type: 'text',
      text: { body },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Meta HTTP ${res.status}`);
  return {
    provider: 'meta',
    sid: data.messages?.[0]?.id ?? 'meta-ok',
    status: 'sent',
  };
}

async function handleWhatsAppSend(req, res) {
  try {
    const { to, body, guest, orderId, kind } = await readBody(req);
    if (!body || typeof body !== 'string') {
      sendJson(res, 400, { error: 'body zorunlu' });
      return;
    }

    let result = null;
    const errors = [];
    for (const fn of [sendViaTwilio, sendViaMeta]) {
      try {
        result = await fn(to || process.env.WHATSAPP_DEFAULT_TO || '+905551112233', body);
        if (result) break;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    if (!result) {
      result = {
        provider: 'mock',
        sid: `mock_${Date.now()}`,
        status: 'simulated',
        note: 'API anahtarı yok — mesaj simüle edildi (Twilio/Meta .env ile canlıya alınır)',
      };
    }

    const entry = {
      id: result.sid,
      to: to || 'default',
      guest: guest ?? null,
      orderId: orderId ?? null,
      kind: kind ?? 'reminder',
      body,
      provider: result.provider,
      status: result.status,
      note: result.note,
      errors: errors.length ? errors : undefined,
      at: new Date().toISOString(),
    };
    messageLog = persistWhatsapp(entry);
    sendJson(res, 200, { ok: true, live: result.provider !== 'mock', ...entry });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'WhatsApp gönderimi başarısız' });
  }
}

function handleWhatsAppLog(_req, res) {
  // Dosya deposundan tazele (zamanlanmış job'lar da buraya yazar)
  messageLog = readWhatsapp();
  sendJson(res, 200, { messages: messageLog });
}

// ─── MINT canlı talep yoğunluğu ───────────────────────────────────────

const PRODUCTS = [
  { id: 'cay', name: 'Çay', base: 40 },
  { id: 'kahve', name: 'Türk Kahvesi', base: 90 },
  { id: 'tost', name: 'Tost', base: 120 },
];

/** Saat dilimine + sinüzoidal yoğunluğa dayalı talep matrisi. */
function computeDemand() {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  // Öğle (12–14) ve akşam (18–20) zirveleri
  const lunch = Math.exp(-((hour - 13) ** 2) / 2);
  const dinner = Math.exp(-((hour - 19) ** 2) / 2);
  const wave = 0.35 + 0.4 * lunch + 0.35 * dinner;
  const tick = Math.sin(Date.now() / 20000) * 0.08;
  const noise = () => (Math.random() - 0.5) * 0.06;

  return PRODUCTS.map((p) => {
    const demand = Math.min(1, Math.max(0.15, wave + tick + noise()));
    // ±%20 esnetme bandı
    const price = Math.round(p.base * (0.85 + demand * 0.35) * 100) / 100;
    return {
      id: p.id,
      name: p.name,
      base: p.base,
      demand: Math.round(demand * 1000) / 1000,
      demandPct: Math.round(demand * 100),
      price,
      band: '±%20',
      updatedAt: now.toISOString(),
    };
  });
}

function handleMintDemand(_req, res) {
  const products = computeDemand();
  const avg = products.reduce((s, p) => s + p.demand, 0) / products.length;
  sendJson(res, 200, {
    provider: 'mint-demand-matrix',
    live: true,
    intensity: Math.round(avg * 100),
    label: avg > 0.7 ? 'Yoğun' : avg > 0.45 ? 'Normal' : 'Sakin',
    products,
    generatedAt: new Date().toISOString(),
  });
}

// ─── NEXUS IoT protokolü ──────────────────────────────────────────────

const devices = [
  {
    id: 'gate-main',
    name: 'Ana Kapı Turnike',
    type: 'turnstile',
    protocol: 'mqtt+http',
    host: '192.168.1.40',
    firmware: 'esp32-v1.4',
    state: 'locked',
    online: true,
  },
  {
    id: 'gate-vip',
    name: 'VIP Salon Kapısı',
    type: 'relay',
    protocol: 'http',
    host: '192.168.1.41',
    firmware: 'rpi-relay-0.9',
    state: 'locked',
    online: true,
  },
  {
    id: 'gate-beach',
    name: 'Plaj RFID Okuyucu',
    type: 'rfid',
    protocol: 'mqtt',
    host: '192.168.1.42',
    firmware: 'esp32-rfid-2.1',
    state: 'idle',
    online: true,
  },
  {
    id: 'kitchen-display',
    name: 'Daze Chef Mutfak Ekranı',
    type: 'display',
    protocol: 'http',
    host: '192.168.1.50',
    firmware: 'rpi-kiosk-1.2',
    state: 'active',
    online: true,
  },
];

let nexusEvents = readNexusEvents();
if (nexusEvents.length === 0) {
  nexusEvents = persistNexusEvent({
    id: 'boot',
    at: new Date().toISOString(),
    deviceId: 'nexus-hub',
    action: 'protocol_ready',
    detail: 'NEXUS IoT protokolü simülasyon modunda hazır',
    ok: true,
  });
}

function handleNexusDevices(_req, res) {
  sendJson(res, 200, {
    protocol: 'likya-nexus-v1',
    mode: process.env.NEXUS_LIVE_URL ? 'live-bridge' : 'simulation',
    devices,
  });
}

function handleNexusEvents(_req, res) {
  sendJson(res, 200, { events: nexusEvents.slice(0, 40) });
}

async function handleNexusCommand(req, res) {
  try {
    const { deviceId, action, passCode } = await readBody(req);
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      sendJson(res, 404, { error: `Cihaz bulunamadı: ${deviceId}` });
      return;
    }
    if (!device.online) {
      sendJson(res, 409, { error: 'Cihaz çevrimdışı', deviceId });
      return;
    }

    const allowed = ['unlock', 'lock', 'pulse', 'status', 'scan'];
    if (!allowed.includes(action)) {
      sendJson(res, 400, { error: `Geçersiz aksiyon. İzin verilenler: ${allowed.join(', ')}` });
      return;
    }

    // Canlı köprü (opsiyonel): NEXUS_LIVE_URL=http://esp32.local/api/command
    let bridge = null;
    const liveUrl = process.env.NEXUS_LIVE_URL;
    if (liveUrl) {
      try {
        const r = await fetch(liveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, action, passCode }),
          signal: AbortSignal.timeout(5000),
        });
        bridge = { status: r.status, body: await r.text() };
      } catch (err) {
        bridge = { error: err instanceof Error ? err.message : String(err) };
      }
    }

    // Simülasyon durumu güncelle
    if (action === 'unlock' || action === 'pulse') device.state = 'unlocked';
    if (action === 'lock') device.state = 'locked';
    if (action === 'scan') device.state = 'idle';
    if (action === 'pulse') {
      setTimeout(() => {
        device.state = 'locked';
      }, 3000);
    }

    const event = {
      id: `evt_${Date.now()}`,
      at: new Date().toISOString(),
      deviceId,
      action,
      passCode: passCode ?? null,
      detail:
        action === 'pulse'
          ? `${device.name}: 3 sn açık (pulse)`
          : `${device.name}: ${action}${passCode ? ` · kod ${passCode}` : ''}`,
      ok: true,
      bridge,
      mode: liveUrl ? 'live-bridge' : 'simulation',
    };
    nexusEvents = persistNexusEvent(event);

    sendJson(res, 200, { ok: true, device, event });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'NEXUS komutu başarısız' });
  }
}

// ─── Vite eklentisi ───────────────────────────────────────────────────

export function createIntegrationsMiddleware() {
  return (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];

    if (req.method === 'OPTIONS' && path.startsWith('/api/')) {
      sendJson(res, 204, {});
      return;
    }

    if (path === '/api/whatsapp/send' && req.method === 'POST') {
      void handleWhatsAppSend(req, res);
      return;
    }
    if (path === '/api/whatsapp/log' && req.method === 'GET') {
      handleWhatsAppLog(req, res);
      return;
    }
    if (path === '/api/mint/demand' && req.method === 'GET') {
      handleMintDemand(req, res);
      return;
    }
    if (path === '/api/nexus/devices' && req.method === 'GET') {
      handleNexusDevices(req, res);
      return;
    }
    if (path === '/api/nexus/events' && req.method === 'GET') {
      handleNexusEvents(req, res);
      return;
    }
    if (path === '/api/nexus/command' && req.method === 'POST') {
      void handleNexusCommand(req, res);
      return;
    }

    next();
  };
}

export function integrationsPlugin() {
  return {
    name: 'likya-integrations',
    configureServer(server) {
      server.middlewares.use(createIntegrationsMiddleware());
    },
  };
}
