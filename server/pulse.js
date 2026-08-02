/**
 * Wave 171 - Campus pulse signal ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('staff-pulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'pls_1',
        score: 8,
        note: 'Iyi tempo',
        person: 'Selin M.',
        channel: 'campus',
        status: 'live',
        at: new Date().toISOString(),
        lastSignalAt: new Date().toISOString(),
      },
    ];
    writeCollection('staff-pulse', seed);
    return seed;
  }
  return list;
}

function openPulseFlags() {
  const flags = readCollection('pulse-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPulseFlag(candidate, actor = 'system') {
  const existing = readCollection('pulse-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('plf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('pulse-flags', list.slice(0, 200));
  return flag;
}

function isStaleSignal(row) {
  if (row.status === 'stale_signal' || row.staleSignal === true) return true;
  const at = Date.parse(row.lastSignalAt || row.signalAt || row.updatedAt || row.at || '');
  return Number.isFinite(at) && at < Date.now() - 30 * 60_000;
}

export function listPulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPulse(input = {}, actor = 'system') {
  const row = {
    id: rid('pul'),
    score: Number(input.score ?? 8) || 0,
    note: input.note !== undefined ? input.note : 'Not',
    person: input.person !== undefined ? input.person : 'Personel',
    channel: input.channel || 'campus',
    status: input.status || 'live',
    at: input.at || new Date().toISOString(),
    lastSignalAt: input.lastSignalAt || input.signalAt || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('staff-pulse', row, 300);
  appendAudit({ actor, action: 'pulse.create', detail: String(row.person || row.channel || row.id), meta: { id: row.id } });
  return row;
}

export function updatePulse(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.score !== undefined) next.score = Number(next.score) || 0;
  list[idx] = next;
  writeCollection('staff-pulse', list);
  appendAudit({ actor, action: 'pulse.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function pulseSummary() {
  const list = listPulse();
  const staleSignals = list.filter(isStaleSignal);
  const campusBeats = list.filter((x) => x.campusBeat === true || x.kind === 'campus_beat');
  const channels = new Set(list.map((x) => x.channel).filter(Boolean));
  const flags = openPulseFlags();
  return {
    title: 'LIKYA Pulse Ops',
    total: list.length,
    live: list.filter((x) => x.status === 'live').length,
    staleSignals: staleSignals.length,
    refreshed: list.filter((x) => x.status === 'refreshed' || x.refreshedAt).length,
    campusBeats: campusBeats.length,
    channels: channels.size,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      live: list.filter((x) => x.status === 'live').length,
      stale_signals: staleSignals.length,
      refreshed: list.filter((x) => x.status === 'refreshed' || x.refreshedAt).length,
      campus_beats: campusBeats.length,
      channels: channels.size,
    },
    summaryLines: [
      `Pulse ${list.length} signal - stale ${staleSignals.length} - channels ${channels.size}`,
      `Campus beats ${campusBeats.length} - refreshed ${list.filter((x) => x.refreshedAt).length} - flag ${flags.length}`,
    ],
    entries: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPulseSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = pulseSummary();
  const created = [];
  const candidates = [];
  if (force || overview.staleSignals > 0) {
    candidates.push({
      key: 'pulse_stale_signal',
      level: overview.staleSignals > 0 ? 'warn' : 'info',
      text: `Stale pulse signals ${overview.staleSignals}`,
      domain: 'signal',
    });
  }
  if (force || overview.refreshed > 0) {
    candidates.push({
      key: 'pulse_channel_refresh',
      level: 'info',
      text: `Pulse refreshed channels ${overview.refreshed}`,
      domain: 'channel',
    });
  }
  if (force || overview.campusBeats > 0) {
    candidates.push({
      key: 'pulse_campus_beat',
      level: 'info',
      text: `Campus beats ${overview.campusBeats}`,
      domain: 'beat',
    });
  }
  for (const candidate of candidates) {
    const flag = addPulseFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `pulse sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('pulse-sweeps', sweep, 80);
  appendAudit({ actor, action: 'pulse.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: pulseSummary() };
}

export function ackPulseFlag(input = {}, actor = 'system') {
  const list = readCollection('pulse-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('pulse-flags', list);
  appendAudit({ actor, action: 'pulse.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: pulseSummary() };
}

export function markPulseStaleSignal(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.channel && x.channel === input.channel));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'live' || x.status === 'refreshed');
  if (idx < 0) return { ok: false, error: 'Stale signal yapilacak pulse yok' };
  list[idx] = {
    ...list[idx],
    status: 'stale_signal',
    staleSignal: true,
    channel: input.channel || list[idx].channel || 'campus',
    lastSignalAt: input.lastSignalAt || new Date(Date.now() - 60 * 60_000).toISOString(),
    staleAt: input.staleAt || new Date().toISOString(),
    staleBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('staff-pulse', list);
  appendAudit({ actor, action: 'pulse.stale_signal', detail: list[idx].channel || list[idx].person, meta: { id: list[idx].id } });
  return { ok: true, pulse: list[idx], overview: pulseSummary() };
}

export function refreshPulseChannel(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.channel && x.channel === input.channel));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isStaleSignal);
  if (idx < 0) return { ok: false, error: 'Refresh edilecek pulse channel yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'refreshed',
    staleSignal: false,
    channel: input.channel || list[idx].channel || 'campus',
    score: Number(input.score ?? list[idx].score ?? 8) || 0,
    lastSignalAt: input.lastSignalAt || new Date().toISOString(),
    refreshedAt: input.refreshedAt || new Date().toISOString(),
    refreshedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('staff-pulse', list);
  appendAudit({ actor, action: 'pulse.channel_refresh', detail: list[idx].channel || list[idx].person, meta: { id: list[idx].id } });
  return { ok: true, pulse: list[idx], overview: pulseSummary() };
}

export function seedCampusBeat(input = {}, actor = 'system') {
  const pulse = createPulse(
    {
      score: Number(input.score ?? 9) || 9,
      note: input.note || 'Campus beat healthy',
      person: input.person || 'Campus ops',
      channel: input.channel || 'campus-beat',
      status: input.status || 'live',
    },
    actor,
  );
  const patched = updatePulse(
    pulse.id,
    {
      campusBeat: true,
      kind: 'campus_beat',
      beatName: input.beatName || input.name || 'Campus beat',
      lastSignalAt: input.lastSignalAt || new Date().toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'pulse.seed_campus_beat', detail: patched?.beatName || pulse.channel, meta: { id: pulse.id } });
  return { ok: true, pulse: patched || pulse, overview: pulseSummary() };
}
