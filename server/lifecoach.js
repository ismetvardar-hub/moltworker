/**
 * Yaşam destek uzmanı — fiziksel / mental / temel + wearable webhook.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { bridgeRecoveryPlan } from './sportbridge.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

const WEBHOOK_SECRET = process.env.LIFECOACH_WEBHOOK_SECRET || 'likya-life-hook-demo';

function ensureClients() {
  let list = readCollection('life-clients', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      {
        id: 'lc_1',
        athlete_id: 'ath_1',
        name: 'Deniz Kaya',
        specialist: 'Uzman Selin',
        wearables: 'watch',
        device_id: 'dev_deniz_watch',
        provider: 'apple',
      },
      {
        id: 'lc_2',
        athlete_id: 'ath_2',
        name: 'Mira Ak',
        specialist: 'Uzman Selin',
        wearables: 'band',
        device_id: 'dev_mira_band',
        provider: 'garmin',
      },
    ];
    writeCollection('life-clients', list);
  }
  return list;
}

function ensureMetrics() {
  let list = readCollection('life-metrics', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'lm_1', client_id: 'lc_1', sleep_h: 7.2, hrv: 68, mood: 7, load: 62, recovery: 71, at: new Date().toISOString() },
      { id: 'lm_2', client_id: 'lc_2', sleep_h: 6.4, hrv: 52, mood: 5, load: 78, recovery: 48, at: new Date().toISOString() },
    ];
    writeCollection('life-metrics', list);
  }
  return list;
}

function ensureDevices() {
  let list = readCollection('life-devices', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'dev_deniz_watch', client_id: 'lc_1', provider: 'apple', label: 'Apple Watch Ultra', status: 'linked', last_seen: null },
      { id: 'dev_mira_band', client_id: 'lc_2', provider: 'garmin', label: 'Garmin HRM', status: 'linked', last_seen: null },
    ];
    writeCollection('life-devices', list);
  }
  return list;
}

/** Normalize provider payloads → common metric shape */
export function normalizeWearablePayload(input = {}) {
  const provider = (input.provider || input.source || 'generic').toLowerCase();
  // Apple HealthKit-ish
  if (provider === 'apple' || provider === 'healthkit') {
    return {
      provider: 'apple',
      client_id: input.client_id,
      device_id: input.device_id,
      sleep_h: Number(input.sleep?.hours ?? input.sleep_h) || 7,
      hrv: Number(input.hrv?.sdnn ?? input.hrv) || 60,
      mood: Number(input.mood) || 6,
      load: Number(input.trainingLoad ?? input.load) || 50,
      recovery: Number(input.recoveryScore ?? input.recovery) || 60,
      resting_hr: Number(input.restingHeartRate ?? input.resting_hr) || null,
      steps: Number(input.steps) || null,
      raw_keys: Object.keys(input),
    };
  }
  // Garmin
  if (provider === 'garmin') {
    return {
      provider: 'garmin',
      client_id: input.client_id,
      device_id: input.device_id,
      sleep_h: Number(input.sleepTimeSeconds ? input.sleepTimeSeconds / 3600 : input.sleep_h) || 7,
      hrv: Number(input.hrv?.lastNightAvg ?? input.hrv) || 60,
      mood: Number(input.mood) || 6,
      load: Number(input.activityTrainingLoad ?? input.load) || 50,
      recovery: Number(input.bodyBattery ?? input.recovery) || 60,
      resting_hr: Number(input.restingHeartRateInBeatsPerMinute ?? input.resting_hr) || null,
      steps: Number(input.steps) || null,
      raw_keys: Object.keys(input),
    };
  }
  // Fitbit
  if (provider === 'fitbit') {
    return {
      provider: 'fitbit',
      client_id: input.client_id,
      device_id: input.device_id,
      sleep_h: Number(input.sleep?.duration ? input.sleep.duration / 3600000 : input.sleep_h) || 7,
      hrv: Number(input.hrv?.dailyRmssd ?? input.hrv) || 60,
      mood: Number(input.mood) || 6,
      load: Number(input.load) || 50,
      recovery: Number(input.recovery ?? (100 - (Number(input.stress) || 40))) || 60,
      resting_hr: Number(input.resting_hr) || null,
      steps: Number(input.steps) || null,
      raw_keys: Object.keys(input),
    };
  }
  return {
    provider: provider || 'generic',
    client_id: input.client_id,
    device_id: input.device_id,
    sleep_h: Number(input.sleep_h) || 7,
    hrv: Number(input.hrv) || 60,
    mood: Number(input.mood) || 6,
    load: Number(input.load) || 50,
    recovery: Number(input.recovery) || 60,
    resting_hr: Number(input.resting_hr) || null,
    steps: Number(input.steps) || null,
    raw_keys: Object.keys(input),
  };
}

export function verifyLifeWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody || '').digest('hex');
  const given = String(signatureHeader).replace(/^sha256=/, '');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function lifeWebhookSecretHint() {
  return { header: 'X-Likya-Signature', algo: 'sha256', demo_secret_set: !!WEBHOOK_SECRET };
}

export function lifeCoachOverview() {
  const clients = ensureClients();
  const metrics = ensureMetrics();
  const devices = ensureDevices();
  const hooks = readCollection('life-webhooks', []) || [];
  const checkins = readCollection('life-checkins', []) || [];
  const flags = metrics.filter((m) => m.recovery < 55 || m.mood < 6);
  const latestByClient = {};
  for (const m of metrics) {
    if (!latestByClient[m.client_id]) latestByClient[m.client_id] = m;
  }
  return {
    title: 'Sağlıklı Yaşam Destek',
    clients,
    devices,
    metrics: metrics.slice(0, 40),
    checkins: (Array.isArray(checkins) ? checkins : []).slice(0, 20),
    flags,
    latestByClient,
    webhooks: (Array.isArray(hooks) ? hooks : []).slice(0, 20),
    pillars: ['Fiziksel', 'Mental', 'Temel (uyku/beslenme/toparlanma)'],
    webhook: lifeWebhookSecretHint(),
    summary: {
      clients: clients.length,
      flags: flags.length,
      wearables_linked: clients.filter((c) => c.wearables).length,
      devices: devices.filter((d) => d.status === 'linked').length,
      webhook_events: Array.isArray(hooks) ? hooks.length : 0,
      checkins: Array.isArray(checkins) ? checkins.length : 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Düşük recovery / mood → ajan kuyruğu + spor recovery planı.
 */
export function processLifeFlags(actor = 'system') {
  const overview = lifeCoachOverview();
  const clients = ensureClients();
  const queue = readCollection('agent-jobs', []) || [];
  const seen = new Set();
  const actions = [];
  for (const flag of overview.flags || []) {
    if (seen.has(flag.client_id)) continue;
    seen.add(flag.client_id);
    const client = clients.find((c) => c.id === flag.client_id);
    const already = (Array.isArray(queue) ? queue : []).some(
      (j) =>
        (j.status === 'queued' || j.status === 'running') &&
        j.agent === 'LIFE-COACH-AI' &&
        j.payload?.client_id === flag.client_id,
    );
    if (!already) {
      const job = enqueueAgentJob(
        {
          agent: 'LIFE-COACH-AI',
          title: `Flag: ${client?.name || flag.client_id} recovery ${flag.recovery}`,
          priority: flag.recovery < 45 ? 'high' : 'normal',
          payload: { client_id: flag.client_id, recovery: flag.recovery, mood: flag.mood },
        },
        actor,
      );
      actions.push({ type: 'enqueue', job: job.job?.id });
    } else {
      actions.push({ type: 'skip_dup', client_id: flag.client_id });
    }
    if (client?.athlete_id) {
      const plan = bridgeRecoveryPlan({ athlete_id: client.athlete_id }, actor);
      actions.push({ type: 'recovery_plan', athlete_id: client.athlete_id, plan: plan.plan?.id });
    }
  }
  appendAudit({
    actor,
    action: 'life.flags_process',
    detail: `${actions.length} otomasyon`,
    meta: { n: actions.length },
  });
  return { ok: true, actions, overview: lifeCoachOverview() };
}

export function ingestWearable(input = {}, actor = 'system') {
  const norm = normalizeWearablePayload(input);
  let clientId = norm.client_id || input.client_id || 'lc_1';
  if (norm.device_id) {
    const devices = ensureDevices();
    const dev = devices.find((d) => d.id === norm.device_id);
    if (dev?.client_id) clientId = dev.client_id;
  }
  const row = {
    id: rid('lm'),
    client_id: clientId,
    sleep_h: norm.sleep_h,
    hrv: norm.hrv,
    mood: norm.mood,
    load: norm.load,
    recovery: norm.recovery,
    resting_hr: norm.resting_hr,
    steps: norm.steps,
    source: norm.provider || input.source || 'smartwatch',
    device_id: norm.device_id || null,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-metrics', row, 500);
  if (norm.device_id) {
    const devices = ensureDevices();
    const idx = devices.findIndex((d) => d.id === norm.device_id);
    if (idx >= 0) {
      devices[idx] = { ...devices[idx], last_seen: row.at, status: 'linked' };
      writeCollection('life-devices', devices);
    }
  }
  appendAudit({
    actor,
    action: 'life.wearable',
    detail: `${row.client_id} recovery ${row.recovery} via ${row.source}`,
    meta: { id: row.id },
  });
  let automation = null;
  if (row.recovery < 55 || row.mood < 6) {
    automation = processLifeFlags(actor);
  }
  return { ok: true, metric: row, automation, overview: lifeCoachOverview() };
}

/** Device/provider webhook — signature optional in demo (skip_verify) */
export function ingestWearableWebhook(input = {}, meta = {}) {
  const actor = meta.actor || 'webhook';
  const verified = !!meta.verified;
  const norm = normalizeWearablePayload(input);
  const event = {
    id: rid('lwh'),
    provider: norm.provider,
    verified,
    device_id: norm.device_id || input.device_id || null,
    client_id: norm.client_id || input.client_id || null,
    at: new Date().toISOString(),
    payload_keys: norm.raw_keys,
  };
  prependItem('life-webhooks', event, 300);
  const ingested = ingestWearable({ ...input, ...norm, source: `webhook:${norm.provider}` }, actor);
  appendAudit({
    actor,
    action: 'life.webhook',
    detail: `${event.provider} verified=${verified}`,
    meta: { id: event.id },
  });
  return { ok: true, event, metric: ingested.metric, overview: lifeCoachOverview() };
}

export function registerLifeDevice(input = {}, actor = 'system') {
  const devices = ensureDevices();
  const row = {
    id: input.id || rid('dev'),
    client_id: input.client_id || 'lc_1',
    provider: (input.provider || 'apple').toLowerCase(),
    label: input.label || 'Wearable',
    status: 'linked',
    last_seen: null,
    at: new Date().toISOString(),
  };
  devices.unshift(row);
  writeCollection('life-devices', devices.slice(0, 100));
  const clients = ensureClients();
  const cidx = clients.findIndex((c) => c.id === row.client_id);
  if (cidx >= 0) {
    clients[cidx] = {
      ...clients[cidx],
      wearables: row.provider,
      device_id: row.id,
      provider: row.provider,
    };
    writeCollection('life-clients', clients);
  }
  appendAudit({ actor, action: 'life.device', detail: `${row.id} · ${row.provider}`, meta: { id: row.id } });
  return { ok: true, device: row, overview: lifeCoachOverview() };
}

export function createLifePlan(input = {}, actor = 'system') {
  const row = {
    id: rid('lp'),
    client_id: input.client_id || 'lc_1',
    physical: input.physical || 'Hafif tempo + mobilite',
    mental: input.mental || '10 dk nefes / journaling',
    fundamentals: input.fundamentals || 'Uyku 8s hedef · protein öğün',
    status: 'active',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-plans', row, 200);
  appendAudit({ actor, action: 'life.plan', detail: row.client_id, meta: { id: row.id } });
  return { ok: true, plan: row };
}

/** Uzman yüz yüze / tele check-in → metrik + opsiyonel plan */
export function lifeCoachCheckIn(input = {}, actor = 'system') {
  const clients = ensureClients();
  const client =
    clients.find((c) => c.id === input.client_id || c.name === input.client_id) || clients[0];
  if (!client) return { ok: false, error: 'Danışan yok' };
  const mood = Number(input.mood) || 6;
  const sleep_h = Number(input.sleep_h) || 7;
  const recovery = Number(input.recovery) || Math.round(50 + mood * 5 + (sleep_h - 6) * 4);
  const note = {
    id: rid('lci'),
    client_id: client.id,
    specialist: input.specialist || client.specialist || actor,
    mood,
    sleep_h,
    recovery: Math.max(0, Math.min(100, recovery)),
    load: Number(input.load) || 50,
    hrv: Number(input.hrv) || 60,
    note: input.note || 'Check-in',
    channel: input.channel || 'in_person',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-checkins', note, 400);
  const metric = ingestWearable(
    {
      client_id: client.id,
      device_id: client.device_id,
      provider: client.provider || 'checkin',
      sleep_h: note.sleep_h,
      mood: note.mood,
      recovery: note.recovery,
      load: note.load,
      hrv: note.hrv,
      source: 'coach_checkin',
    },
    actor,
  );
  let plan = null;
  if (input.write_plan !== false && note.recovery < 60) {
    plan = createLifePlan(
      {
        client_id: client.id,
        physical: 'Aktif dinlenme · yürüyüş',
        mental: 'Kısa nefes + ekran kes',
        fundamentals: `Uyku hedef ${Math.max(8, sleep_h + 1)}s · hidrasyon`,
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'life.checkin',
    detail: `${client.name} mood ${mood} recovery ${note.recovery}`,
    meta: { id: note.id },
  });
  return {
    ok: true,
    checkin: note,
    metric: metric.metric,
    plan: plan?.plan || null,
    overview: lifeCoachOverview(),
  };
}

export function signLifeWebhookDemo(bodyObj) {
  const raw = JSON.stringify(bodyObj || {});
  const sig = createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  return { raw, signature: `sha256=${sig}` };
}
