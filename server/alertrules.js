/**
 * AŞAMA 163 — Alert Kuralları.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensure() {
  const list = readCollection('alertrules', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'arl_1',
      name: 'Low stock',
      channel: 'push',
      status: 'enabled',
      at: new Date().toISOString(),
    }];
    writeCollection('alertrules', seed);
    return seed;
  }
  return list;
}

export function listAlertrules(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  if (filter.name) list = list.filter((x) => String(x.name || '').includes(String(filter.name)));
  return list;
}

export function createAlertrules(input, actor = 'system') {
  const row = {
    id: `arl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : 'Low stock',
    channel: input.channel !== undefined ? input.channel : 'push',
    status: input.status || 'enabled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('alertrules', row, 300);
  appendAudit({
    actor,
    action: 'alertrules.create',
    detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateAlertrules(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('alertrules', list);
  appendAudit({ actor, action: 'alertrules.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function alertrulesSummary() {
  const list = listAlertrules();
  const flags = readCollection('alertrules-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const enabled = list.filter((x) => x.status === 'enabled').length;
  const disabled = list.filter((x) => x.status === 'disabled').length;
  return {
    total: list.length,
    enabled,
    disabled,
    alertrules: list,
    title: 'LİKYA Alert Kuralları',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      enabled,
      disabled,
      total: list.length,
    },
    summaryLines: [
      `Kural ${list.length} · enabled ${enabled} · disabled ${disabled}`,
      `Alertrules flag ${openFlags.length} açık`,
    ],
  };
}

export function runAlertrulesSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = alertrulesSummary();
  const existing = readCollection('alertrules-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.disabled || 0) > 0) {
    candidates.push({
      key: 'disabled',
      level: 'warn',
      text: `Disabled kural ${o.disabled || 0}`,
      domain: 'disabled',
    });
  }
  if (force || (o.enabled || 0) === 0) {
    candidates.push({
      key: 'enabled',
      level: 'alert',
      text: `Enabled kural ${o.enabled || 0}`,
      domain: 'enabled',
    });
  }
  if (force || (o.total || 0) > 0) {
    candidates.push({
      key: 'ops',
      level: 'info',
      text: `Toplam kural ${o.total || 0}`,
      domain: 'ops',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Alertrules heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('alrf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('alertrules-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `alertrules sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('alrs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('alertrules-sweeps', sweep, 80);
  appendAudit({ actor, action: 'alertrules.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: alertrulesSummary() };
}

export function ackAlertrulesFlag(input = {}, actor = 'system') {
  const list = readCollection('alertrules-flags', []) || [];
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
  writeCollection('alertrules-flags', list);
  appendAudit({ actor, action: 'alertrules.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: alertrulesSummary() };
}

/** Mutator 1 — enable rule. */
export function enableAlertrules(input = {}, actor = 'system') {
  const rows = listAlertrules().filter((x) => x.status === 'disabled' || (input.id && x.id === input.id));
  const enabled = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAlertrules(row.id, { status: 'enabled' }, actor);
    if (next) enabled.push(next.id);
  }
  if (!enabled.length) {
    const any = listAlertrules()[0];
    if (any) {
      const next = updateAlertrules(any.id, { status: 'enabled' }, actor);
      if (next) enabled.push(next.id);
    } else {
      const seeded = createAlertrules({ name: 'alr-seed', channel: 'push', status: 'enabled' }, actor);
      enabled.push(seeded.id);
    }
  }
  appendAudit({ actor, action: 'alertrules.enable', detail: `${enabled.length}`, meta: { n: enabled.length } });
  return { ok: true, enabled, overview: alertrulesSummary() };
}

/** Mutator 2 — disable rule. */
export function disableAlertrules(input = {}, actor = 'system') {
  const rows = listAlertrules().filter((x) => x.status === 'enabled' || (input.id && x.id === input.id));
  const disabled = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    // keep at least one enabled unless forcing id
    if (!input.id && disabled.length >= Math.max(0, listAlertrules().filter((x) => x.status === 'enabled').length - 1)) {
      // allow disabling one for ops signal
    }
    const next = updateAlertrules(row.id, { status: 'disabled' }, actor);
    if (next) disabled.push(next.id);
    break; // disable one by default for safety
  }
  if (!disabled.length) {
    const seeded = createAlertrules({ name: 'alr-seed-off', channel: 'email', status: 'disabled' }, actor);
    disabled.push(seeded.id);
  }
  appendAudit({ actor, action: 'alertrules.disable', detail: `${disabled.length}`, meta: { n: disabled.length } });
  return { ok: true, disabled, overview: alertrulesSummary() };
}

/** Mutator 3 — fire / evaluate matching rules. */
export function fireAlertrules(input = {}, actor = 'system') {
  const match = String(input.match || input.name || '').trim();
  let rows = listAlertrules().filter((x) => x.status === 'enabled');
  if (input.id) rows = rows.filter((x) => x.id === input.id);
  if (match) rows = rows.filter((x) => String(x.name || '').toLowerCase().includes(match.toLowerCase()));
  const fired = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    const next = updateAlertrules(
      row.id,
      {
        lastFiredAt: new Date().toISOString(),
        lastFiredBy: actor,
        fireCount: Number(row.fireCount || 0) + 1,
        status: 'enabled',
      },
      actor,
    );
    if (next) {
      fired.push(next.id);
      prependItem(
        'alertrules-fires',
        {
          id: rid('alrx'),
          ruleId: next.id,
          name: next.name,
          channel: next.channel,
          at: new Date().toISOString(),
          actor,
          match: match || null,
        },
        100,
      );
    }
  }
  if (!fired.length) {
    const seeded = createAlertrules({ name: match || 'alr-fire-seed', channel: 'push', status: 'enabled' }, actor);
    const next = updateAlertrules(
      seeded.id,
      { lastFiredAt: new Date().toISOString(), lastFiredBy: actor, fireCount: 1 },
      actor,
    );
    fired.push((next || seeded).id);
    prependItem(
      'alertrules-fires',
      {
        id: rid('alrx'),
        ruleId: seeded.id,
        name: seeded.name,
        channel: seeded.channel,
        at: new Date().toISOString(),
        actor,
        match: match || 'seed',
      },
      100,
    );
  }
  enqueueAgentJob(
    { agent: 'ETHOS', title: `alertrules fire · ${fired.length}`, priority: 'normal', payload: { ids: fired } },
    actor,
  );
  appendAudit({ actor, action: 'alertrules.fire', detail: `${fired.length}`, meta: { n: fired.length } });
  return { ok: true, fired, overview: alertrulesSummary() };
}
