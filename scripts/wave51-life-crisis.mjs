import { readFileSync, writeFileSync } from 'node:fs';

const p = '/workspace/server/lifecoach.js';
let t = readFileSync(p, 'utf8');

const oldSummary = `    summary: {
      clients: clients.length,
      flags: flags.length,
      wearables_linked: clients.filter((c) => c.wearables).length,
      devices: devices.filter((d) => d.status === 'linked').length,
      webhook_events: Array.isArray(hooks) ? hooks.length : 0,
      checkins: Array.isArray(checkins) ? checkins.length : 0,
      followups_open: openFu.length,
      adherence_avg:
        Array.isArray(adherence) && adherence[0]?.avg_score != null ? adherence[0].avg_score : null,
    },`;

const newSummary = `    summary: {
      clients: clients.length,
      flags: flags.length,
      wearables_linked: clients.filter((c) => c.wearables).length,
      devices: devices.filter((d) => d.status === 'linked').length,
      webhook_events: Array.isArray(hooks) ? hooks.length : 0,
      checkins: Array.isArray(checkins) ? checkins.length : 0,
      followups_open: openFu.length,
      adherence_avg:
        Array.isArray(adherence) && adherence[0]?.avg_score != null ? adherence[0].avg_score : null,
      crises_open: (readCollection('life-crises', []) || []).filter((c) => c.status === 'open').length,
      missed_checkins: (readCollection('life-missed-checkins', []) || []).filter((m) => m.status === 'open')
        .length,
    },`;

if (t.includes(oldSummary)) {
  t = t.replace(oldSummary, newSummary);
  console.log('summary');
} else if (!t.includes('crises_open')) {
  console.error('SUMMARY_MISS');
  process.exit(1);
}

if (t.includes('export function flagLifeCrisis')) {
  console.log('apis already');
} else {
  t =
    t.trimEnd() +
    `
/** Kriz bayrağı — düşük mood/recovery veya manuel */
export function flagLifeCrisis(input = {}, actor = 'system') {
  const clients = ensureClients();
  const client =
    clients.find((c) => c.id === input.client_id) ||
    clients.find((c) => c.name === input.client_id) ||
    clients[0];
  if (!client) return { ok: false, error: 'Danışan yok' };
  const open = (readCollection('life-crises', []) || []).find(
    (c) => c.client_id === client.id && c.status === 'open',
  );
  if (open && !input.force) return { ok: false, error: 'Açık kriz var', crisis: open };
  const severity = ['watch', 'high', 'critical'].includes(input.severity) ? input.severity : 'high';
  const crisis = {
    id: rid('lcr'),
    client_id: client.id,
    client_name: client.name,
    severity,
    reason: String(input.reason || 'manual_flag').slice(0, 240),
    mood: input.mood != null ? Number(input.mood) : null,
    recovery: input.recovery != null ? Number(input.recovery) : null,
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-crises', crisis, 200);
  const cidx = clients.findIndex((c) => c.id === client.id);
  if (cidx >= 0) {
    clients[cidx] = { ...clients[cidx], crisis_id: crisis.id, crisis_status: 'open', crisis_severity: severity };
    writeCollection('life-clients', clients);
  }
  enqueueAgentJob(
    {
      agent: 'LIFE-COACH-AI',
      title: \`crisis · \${client.name} · \${severity}\`,
      priority: severity === 'critical' ? 'critical' : 'high',
      payload: { crisis_id: crisis.id, client_id: client.id },
    },
    actor,
  );
  if (client.athlete_id) {
    bridgeRecoveryPlan({ athlete_id: client.athlete_id, week: input.week }, actor);
  }
  scheduleLifeFollowUps({ client_id: client.id, due_days: 1, channel: 'tele', limit: 1 }, actor);
  appendAudit({
    actor,
    action: 'life.crisis_flag',
    detail: \`\${client.name} · \${severity}\`,
    meta: { id: crisis.id },
  });
  return { ok: true, crisis, overview: lifeCoachOverview() };
}

/** Kriz kapat */
export function clearLifeCrisis(input = {}, actor = 'system') {
  const list = readCollection('life-crises', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Kriz yok' };
  let idx = list.findIndex((c) => c.id === input.id && c.status === 'open');
  if (idx < 0) {
    idx = list.findIndex(
      (c) => c.status === 'open' && (!input.client_id || c.client_id === input.client_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Açık kriz yok' };
  list[idx] = {
    ...list[idx],
    status: 'cleared',
    cleared_at: new Date().toISOString(),
    cleared_by: actor,
    outcome: input.outcome || 'stabilized',
    note: String(input.note || '').slice(0, 400),
  };
  writeCollection('life-crises', list);
  const clients = ensureClients();
  const cidx = clients.findIndex((c) => c.id === list[idx].client_id);
  if (cidx >= 0) {
    clients[cidx] = {
      ...clients[cidx],
      crisis_id: null,
      crisis_status: 'cleared',
      crisis_severity: null,
    };
    writeCollection('life-clients', clients);
  }
  const clearout = {
    id: rid('lcc'),
    crisis_id: list[idx].id,
    client_id: list[idx].client_id,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-crisis-clears', clearout, 120);
  appendAudit({
    actor,
    action: 'life.crisis_clear',
    detail: list[idx].client_name,
    meta: { id: clearout.id, crisis_id: list[idx].id },
  });
  return { ok: true, crisis: list[idx], clearout, overview: lifeCoachOverview() };
}

/** Kaçırılan check-in SLA — stale danışanları işaretle + opsiyonel kriz */
export function runLifeMissedCheckInSweep(input = {}, actor = 'system') {
  const clients = ensureClients();
  const checkins = readCollection('life-checkins', []) || [];
  const ciList = Array.isArray(checkins) ? checkins : [];
  const hours = Number(input.stale_hours) || 72;
  const cutoff = Date.now() - hours * 3600_000;
  const missed = [];
  const crises = [];
  for (const client of clients) {
    if (input.client_id && client.id !== input.client_id) continue;
    const latest = ciList.find((c) => c.client_id === client.id);
    const lastAt = latest?.at ? new Date(latest.at).getTime() : 0;
    const stale = !lastAt || lastAt < cutoff || input.force;
    if (!stale) continue;
    const row = {
      id: rid('lmc'),
      client_id: client.id,
      client_name: client.name,
      last_checkin_at: latest?.at || null,
      stale_hours: hours,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    prependItem('life-missed-checkins', row, 200);
    missed.push(row);
    enqueueAgentJob(
      {
        agent: 'LIFE-COACH-AI',
        title: \`missed check-in · \${client.name}\`,
        priority: 'high',
        payload: { missed_id: row.id, client_id: client.id },
      },
      actor,
    );
    if (input.escalate_crisis || input.force_crisis) {
      const cr = flagLifeCrisis(
        {
          client_id: client.id,
          severity: input.severity || 'watch',
          reason: 'missed_checkin_sla',
          force: true,
        },
        actor,
      );
      if (cr.ok) crises.push(cr.crisis);
    } else {
      scheduleLifeFollowUps({ client_id: client.id, due_days: 1, limit: 1 }, actor);
    }
  }
  const sweep = {
    id: rid('lmcs'),
    missed: missed.length,
    crises: crises.length,
    stale_hours: hours,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('life-missed-checkin-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'life.missed_checkin_sweep',
    detail: \`\${missed.length} missed · \${crises.length} crisis\`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, missed, crises, overview: lifeCoachOverview() };
}
`;
  console.log('apis');
}

writeFileSync(p, t);
console.log('WAVE51_LIFE_OK');
