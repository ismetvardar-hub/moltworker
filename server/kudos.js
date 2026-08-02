/**
 * AŞAMA 57 — Personel takdir / kudos.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function listKudos(limit = 40) {
  return readCollection('kudos', []).slice(0, limit);
}

export function createKudos(input, actor = 'system') {
  const entry = {
    id: `kd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    toPerson: String(input.toPerson || '').trim() || 'Ekip',
    fromPerson: input.fromPerson || actor,
    message: String(input.message || '').trim() || 'Teşekkürler',
    tag: input.tag || 'centilmenlik',
    at: new Date().toISOString(),
  };
  prependItem('kudos', entry, 300);
  appendAudit({
    actor,
    action: 'kudos.create',
    detail: `${entry.fromPerson} → ${entry.toPerson}: ${entry.tag}`,
    meta: { id: entry.id },
  });
  return entry;
}

export function kudosSummary() {
  const list = listKudos(100);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = list.filter((k) => k.at?.slice(0, 10) === today).length;
  const byTag = {};
  for (const k of list) {
    const t = k.tag || 'genel';
    byTag[t] = (byTag[t] || 0) + 1;
  }
  const flags = readCollection('kudos-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA Takdir / Kudos',
    generatedAt: new Date().toISOString(),
    total: list.length,
    today: todayCount,
    byTag,
    entries: list.slice(0, 30),
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      total: list.length,
      today: todayCount,
      tags: Object.keys(byTag).length,
    },
    summaryLines: [
      `Bugün ${todayCount} kudos · toplam ${list.length}`,
      `Etiket ${Object.keys(byTag).length} · flag ${openFlags.length} açık`,
    ],
  };
}

export function runKudosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = kudosSummary();
  const existing = readCollection('kudos-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.today || 0) === 0) {
    candidates.push({
      key: 'daily_gap',
      level: (o.summary?.today || 0) === 0 ? 'warn' : 'info',
      text: `Bugün kudos ${o.summary?.today || 0}`,
      domain: 'daily',
    });
  }
  if (force || (o.summary?.total || 0) < 3) {
    candidates.push({
      key: 'low_volume',
      level: 'info',
      text: `Toplam kudos ${o.summary?.total || 0}`,
      domain: 'volume',
    });
  }
  if (force || (o.summary?.tags || 0) < 2) {
    candidates.push({
      key: 'tag_diversity',
      level: 'info',
      text: `Etiket çeşitliliği ${o.summary?.tags || 0}`,
      domain: 'tags',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Kudos heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('kdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('kudos-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `kudos sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('kds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('kudos-sweeps', sweep, 80);
  appendAudit({ actor, action: 'kudos.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: kudosSummary() };
}

export function ackKudosFlag(input = {}, actor = 'system') {
  const list = readCollection('kudos-flags', []) || [];
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
  writeCollection('kudos-flags', list);
  appendAudit({ actor, action: 'kudos.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: kudosSummary() };
}

export function createThankYouBurst(input = {}, actor = 'system') {
  const people = Array.isArray(input.people) && input.people.length
    ? input.people.map((p) => String(p).trim()).filter(Boolean)
    : ['Ayşe T.', 'Mert A.', 'Elena K.'];
  const tag = input.tag || 'centilmenlik';
  const message = String(input.message || 'Teşekkür burst').slice(0, 200);
  const created = [];
  for (const toPerson of people.slice(0, Number(input.limit) || 8)) {
    created.push(createKudos({ toPerson, message, tag, fromPerson: input.fromPerson || actor }, actor));
  }
  appendAudit({ actor, action: 'kudos.burst', detail: `${created.length}`, meta: { n: created.length } });
  return { ok: true, created, overview: kudosSummary() };
}

export function refreshKudosTagFilter(input = {}, actor = 'system') {
  const o = kudosSummary();
  const tag = String(input.tag || Object.keys(o.byTag || {})[0] || 'centilmenlik');
  const matched = listKudos(100).filter((k) => (k.tag || 'genel') === tag);
  const snap = {
    id: rid('kdt'),
    tag,
    count: matched.length,
    at: new Date().toISOString(),
    actor,
    sample: matched.slice(0, 8).map((k) => ({ id: k.id, toPerson: k.toPerson, message: k.message })),
  };
  prependItem('kudos-tag-refresh', snap, 60);
  appendAudit({ actor, action: 'kudos.tags_refresh', detail: `${tag}:${matched.length}`, meta: { id: snap.id } });
  return { ok: true, refresh: snap, overview: kudosSummary() };
}

export function seedDailyKudos(input = {}, actor = 'system') {
  const o = kudosSummary();
  const seeded = [];
  if ((o.summary?.today || 0) === 0 || input.force) {
    seeded.push(
      createKudos(
        {
          toPerson: input.toPerson || 'Ekip',
          message: input.message || 'Günün teşekkürü',
          tag: input.tag || 'gunluk',
          fromPerson: actor,
        },
        actor,
      ),
    );
  }
  if (!seeded.length) {
    seeded.push(
      createKudos(
        { toPerson: 'Ekip', message: 'Daily kudos seed', tag: 'gunluk', fromPerson: actor },
        actor,
      ),
    );
  }
  appendAudit({ actor, action: 'kudos.daily_seed', detail: `${seeded.length}`, meta: { n: seeded.length } });
  return { ok: true, seeded, overview: kudosSummary() };
}
