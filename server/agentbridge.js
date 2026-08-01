/**
 * Adım 9 — Ajan komuta köprüsü: tek hub sinyali.
 */
import { appendAudit } from './audit.js';
import { campusCoreOverview, createCampusWorkOrder } from './campuscore.js';
import { stayRingOverview } from './stayring.js';
import { athleteOsOverview } from './athleteos.js';
import { lifeCoachOverview } from './lifecoach.js';
import { marketOsOverview } from './marketos.js';
import { openMallOverview } from './openmall.js';
import { familyCampOverview } from './familycamp.js';
import { extremeOverview } from './extremepark.js';
import { cultureSceneOverview } from './culturescene.js';
import { sportBridgeOverview } from './sportbridge.js';
import { agentQueueOverview, enqueueAgentJob } from './agentqueue.js';
import { greenPulseOverview } from './greenpulse.js';
import { agentFleetOverview, dispatchFleetDirective, pingFleetAgent } from './agentfleet.js';
import { prependItem, readCollection, writeCollection } from './store.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function agentBridgeOverview() {
  const campus = campusCoreOverview();
  const stay = stayRingOverview();
  const athletes = athleteOsOverview();
  const life = lifeCoachOverview();
  const market = marketOsOverview();
  const mall = openMallOverview();
  const family = familyCampOverview();
  const extreme = extremeOverview();
  const culture = cultureSceneOverview();
  const sport = sportBridgeOverview();
  const queue = agentQueueOverview();
  const green = greenPulseOverview();
  const fleet = agentFleetOverview();

  const agents = (fleet.agents || [])
    .filter((a) => a.campus)
    .map((a) => ({
      id: a.code,
      role: a.role,
      signal: `q ${a.queue?.queued || 0}/${a.queue?.running || 0} · ${a.status}`,
      status: a.status === 'standby' ? 'standby' : 'online',
      department: a.department,
    }));

  const channels = readCollection('agent-bridge-channels', []) || [];
  const alerts = readCollection('agent-bridge-alerts', []) || [];
  const chList = Array.isArray(channels) ? channels : [];
  const alertList = Array.isArray(alerts) ? alerts : [];
  return {
    title: 'Ajan Komuta Köprüsü',
    ethos: 'ETHOS güler · ajanlar çalışır · orman dinlenir.',
    master_rule: fleet.master_rule,
    agents,
    fleet: fleet.summary,
    channels: chList.filter((c) => c.status === 'open' || c.status === 'snoozed').slice(0, 24),
    alerts: alertList.filter((a) => a.status === 'open' || a.status === 'muted').slice(0, 24),
    pulses: {
      campus: campus.summary,
      stay: stay.summary,
      athletes: athletes.summary,
      life: life.summary,
      market: market.summary,
      mall: mall.summary,
      family: family.summary,
      extreme: extreme.summary,
      culture: culture.summary,
      sport: sport.summary,
      queue: queue.summary,
      green: green.summary,
      fleet: fleet.summary,
    },
    links: {
      campus: '/api/campus',
      stay: '/api/stayring',
      athletes: '/api/athleteos',
      life: '/api/lifecoach',
      market: '/api/marketos',
      mall: '/api/openmall',
      family: '/api/familycamp',
      extreme: '/api/extreme',
      culture: '/api/culture',
      sport: '/api/sportbridge',
      queue: '/api/agentqueue',
      green: '/api/greenpulse',
      brief: '/api/campusbrief',
      fleet: '/api/agentfleet',
    },
    summary: {
      agents: agents.length,
      channels_open: chList.filter((c) => c.status === 'open').length,
      channels_snoozed: chList.filter((c) => c.status === 'snoozed').length,
      channels_closed: chList.filter((c) => c.status === 'closed').length,
      alerts_open: alertList.filter((a) => a.status === 'open').length,
      alerts_muted: alertList.filter((a) => a.status === 'muted').length,
      alerts_routed: alertList.filter((a) => a.routed).length,
      alerts_sla_breach: alertList.filter((a) => a.sla_breach).length,
      fleet_online: fleet.summary?.online ?? 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function agentBridgePing(input = {}, actor = 'system') {
  const agent = input.agent || 'DAZE-HUB';
  pingFleetAgent({ agent, note: input.note || 'nabız' }, actor);
  appendAudit({
    actor,
    action: 'agent.ping',
    detail: `${agent}: ${input.note || 'nabız'}`,
    meta: { agent },
  });
  return { ok: true, agent, overview: agentBridgeOverview() };
}

/** Köprüden çoklu ajan broadcast — fleet dispatch + kuyruk seed */
export function agentBridgeBroadcast(input = {}, actor = 'system') {
  const title = input.title || 'Köprü broadcast — kampüs nabız';
  const dispatched = dispatchFleetDirective({ title, note: input.note || '' }, actor);
  const targets = dispatched.targets || ['DAZE-HUB', 'ETHOS', 'NEXUS'];
  const jobs = [];
  for (const agent of targets.slice(0, 8)) {
    const r = enqueueAgentJob(
      {
        agent,
        title: `${title} · ${agent}`,
        priority: input.priority || 'high',
        payload: { broadcast: true, from: 'agentbridge' },
      },
      actor,
    );
    jobs.push(r.job?.id);
  }
  const row = {
    id: `abb_${Date.now().toString(36)}`,
    title,
    targets,
    jobs,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('agent-broadcasts', row, 100);
  appendAudit({
    actor,
    action: 'agent.broadcast',
    detail: `${title} · ${targets.length} hedef`,
    meta: { id: row.id },
  });
  return { ok: true, broadcast: row, dispatch: dispatched, overview: agentBridgeOverview() };
}

/** Operasyon kanalı aç — topic + ajan üyeleri */
export function openAgentBridgeChannel(input = {}, actor = 'system') {
  const topic = input.topic || input.title || 'kampüs-ops';
  const members = Array.isArray(input.members) && input.members.length
    ? input.members
    : ['LİKYA-1', 'DAZE-HUB', 'ETHOS', 'NEXUS'];
  const channel = {
    id: rid('abc'),
    topic,
    members,
    status: 'open',
    pulses: 0,
    last_pulse: null,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('agent-bridge-channels', channel, 200);
  for (const agent of members.slice(0, 6)) {
    enqueueAgentJob(
      {
        agent,
        title: `köprü kanal · ${topic}`,
        priority: 'normal',
        payload: { channel_id: channel.id },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'agent.channel_open',
    detail: topic,
    meta: { id: channel.id },
  });
  return { ok: true, channel, overview: agentBridgeOverview() };
}

/** Kanal nabız — üye ping + sayaç */
export function pulseAgentBridgeChannel(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-channels', []) || [];
  if (!Array.isArray(list) || !list.length) {
    const opened = openAgentBridgeChannel({ topic: input.topic || 'kampüs-ops' }, actor);
    return pulseAgentBridgeChannel({ ...input, id: opened.channel?.id }, actor);
  }
  let idx = list.findIndex((c) => c.id === input.id && c.status === 'open');
  if (idx < 0) idx = list.findIndex((c) => c.topic === input.topic && c.status === 'open');
  if (idx < 0) idx = list.findIndex((c) => c.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık kanal yok' };
  list[idx] = {
    ...list[idx],
    pulses: (Number(list[idx].pulses) || 0) + 1,
    last_pulse: new Date().toISOString(),
    last_note: input.note || 'pulse',
  };
  writeCollection('agent-bridge-channels', list);
  const member = input.agent || list[idx].members?.[0] || 'DAZE-HUB';
  pingFleetAgent({ agent: member, note: `channel:${list[idx].topic}` }, actor);
  appendAudit({
    actor,
    action: 'agent.channel_pulse',
    detail: list[idx].topic,
    meta: { id: list[idx].id },
  });
  return { ok: true, channel: list[idx], overview: agentBridgeOverview() };
}

/** Köprü alert escalate → LİKYA-1 + domain ajan */
export function escalateAgentBridgeAlert(input = {}, actor = 'system') {
  const severity = input.severity || 'high';
  const domain = input.domain || input.href || 'campus';
  const agentMap = {
    extreme: 'REMINDER-AI',
    green: 'GAIA-ESG',
    greenpulse: 'GAIA-ESG',
    stay: 'DAZE-CREW',
    stayring: 'DAZE-CREW',
    culture: 'CULTURE-AI',
    sport: 'SPORT-BRIDGE',
    life: 'LIFE-COACH-AI',
    lifecoach: 'LIFE-COACH-AI',
    mall: 'MINT',
    openmall: 'MINT',
    market: 'MINT',
    family: 'DAZE-CREW',
  };
  const domainAgent = agentMap[domain] || input.agent || 'DAZE-HUB';
  const alert = {
    id: rid('aba'),
    title: input.title || `Köprü alert · ${domain}`,
    severity,
    domain,
    status: 'open',
    agents: ['LİKYA-1', domainAgent, 'ETHOS'],
    at: new Date().toISOString(),
    actor,
  };
  prependItem('agent-bridge-alerts', alert, 200);
  for (const agent of alert.agents) {
    enqueueAgentJob(
      {
        agent,
        title: `ALERT · ${alert.title}`,
        priority: severity === 'critical' ? 'high' : severity,
        payload: { alert_id: alert.id, domain },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'agent.alert_escalate',
    detail: alert.title,
    meta: { id: alert.id },
  });
  return { ok: true, alert, overview: agentBridgeOverview() };
}

export function resolveAgentBridgeAlert(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-alerts', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Alert yok' };
  let idx = list.findIndex((a) => a.id === input.id && (a.status === 'open' || a.status === 'muted'));
  if (idx < 0) idx = list.findIndex((a) => a.status === 'open' || a.status === 'muted');
  if (idx < 0) return { ok: false, error: 'Açık alert yok' };
  list[idx] = {
    ...list[idx],
    status: 'resolved',
    resolution: input.resolution || 'kapatıldı',
    resolved_at: new Date().toISOString(),
    resolved_by: actor,
  };
  writeCollection('agent-bridge-alerts', list);
  appendAudit({
    actor,
    action: 'agent.alert_resolve',
    detail: list[idx].title,
    meta: { id: list[idx].id },
  });
  return { ok: true, alert: list[idx], overview: agentBridgeOverview() };
}

/** Açık köprü kanalını kapat */
export function closeAgentBridgeChannel(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-channels', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Kanal yok' };
  let idx = list.findIndex((c) => c.id === input.id && (c.status === 'open' || c.status === 'snoozed'));
  if (idx < 0) idx = list.findIndex((c) => c.topic === input.topic && (c.status === 'open' || c.status === 'snoozed'));
  if (idx < 0) idx = list.findIndex((c) => c.status === 'open' || c.status === 'snoozed');
  if (idx < 0) return { ok: false, error: 'Açık kanal yok' };
  list[idx] = {
    ...list[idx],
    status: 'closed',
    closed_at: new Date().toISOString(),
    closed_by: actor,
    close_reason: input.reason || 'ops_done',
  };
  writeCollection('agent-bridge-channels', list);
  enqueueAgentJob(
    {
      agent: 'DAZE-HUB',
      title: `kanal kapat · ${list[idx].topic}`,
      priority: 'low',
      payload: { channel_id: list[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'agent.channel_close',
    detail: list[idx].topic,
    meta: { id: list[idx].id },
  });
  return { ok: true, channel: list[idx], overview: agentBridgeOverview() };
}

/** Yaşlanmış açık alertler → SLA breach + fleet/queue bump */
export function runAgentBridgeAlertSlaSweep(input = {}, actor = 'system') {
  const maxAgeMin = Number(input.max_age_min) || 30;
  const cutoff = Date.now() - maxAgeMin * 60_000;
  const list = readCollection('agent-bridge-alerts', []) || [];
  const breached = [];
  for (let i = 0; i < (Array.isArray(list) ? list.length : 0); i++) {
    const a = list[i];
    if (a.status !== 'open') continue; // muted alertler SLA dışı
    const at = a.at ? new Date(a.at).getTime() : 0;
    const force = input.force === true || input.id === a.id;
    if (!force && at && at > cutoff) continue;
    list[i] = {
      ...a,
      sla_breach: true,
      sla_flagged_at: new Date().toISOString(),
      severity: a.severity === 'critical' ? 'critical' : 'critical',
    };
    breached.push(list[i]);
    dispatchFleetDirective(
      {
        title: `SLA alert · ${a.title}`,
        priority: 'high',
        agent: a.agents?.[1] || 'DAZE-HUB',
        payload: { alert_id: a.id, domain: a.domain },
      },
      actor,
    );
  }
  writeCollection('agent-bridge-alerts', list);
  const sweep = {
    id: rid('abas'),
    max_age_min: maxAgeMin,
    breached: breached.length,
    ids: breached.map((b) => b.id),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('agent-bridge-sla-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'agent.alert_sla_sweep',
    detail: `${breached.length} breach · ${maxAgeMin}dk`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, breached, overview: agentBridgeOverview() };
}

/** Alert geçici sustur (mute) — SLA sweep atlar */
export function muteAgentBridgeAlert(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-alerts', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Alert yok' };
  let idx = list.findIndex((a) => a.id === input.id && a.status === 'open');
  if (idx < 0) idx = list.findIndex((a) => a.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık alert yok' };
  const minutes = Math.max(1, Math.min(24 * 60, Number(input.minutes) || 60));
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  list[idx] = {
    ...list[idx],
    status: 'muted',
    mute_until: until,
    mute_reason: String(input.reason || '').slice(0, 240) || undefined,
    muted_at: new Date().toISOString(),
    muted_by: actor,
  };
  writeCollection('agent-bridge-alerts', list);
  appendAudit({
    actor,
    action: 'agent.alert_mute',
    detail: `${list[idx].title} · ${minutes}dk`,
    meta: { id: list[idx].id, minutes },
  });
  return { ok: true, alert: list[idx], overview: agentBridgeOverview() };
}

/** Mute süresi dolan / force unmute */
export function unmuteAgentBridgeAlerts(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-alerts', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: true, unmuted: [], overview: agentBridgeOverview() };
  const limit = Math.max(1, Math.min(200, Number(input.limit) || 40));
  const force = !!input.force;
  const now = Date.now();
  const unmuted = [];
  for (let i = 0; i < list.length && unmuted.length < limit; i++) {
    const a = list[i];
    if (a.status !== 'muted') continue;
    if (input.id && a.id !== input.id) continue;
    const until = a.mute_until ? new Date(a.mute_until).getTime() : 0;
    if (!force && !input.id && until && until > now) continue;
    list[i] = {
      ...a,
      status: 'open',
      mute_until: null,
      unmuted_at: new Date().toISOString(),
      unmuted_by: actor,
    };
    unmuted.push(list[i].id);
  }
  if (unmuted.length) {
    writeCollection('agent-bridge-alerts', list);
    appendAudit({
      actor,
      action: 'agent.alert_unmute',
      detail: `${unmuted.length} alert`,
      meta: { n: unmuted.length },
    });
  }
  return { ok: true, unmuted, overview: agentBridgeOverview() };
}

/** Kanal snooze — pulse/SLA dışında beklet */
export function snoozeAgentBridgeChannel(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-channels', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Kanal yok' };
  let idx = list.findIndex((c) => c.id === input.id && c.status === 'open');
  if (idx < 0) idx = list.findIndex((c) => c.topic === input.topic && c.status === 'open');
  if (idx < 0) idx = list.findIndex((c) => c.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık kanal yok' };
  const minutes = Math.max(1, Math.min(24 * 60, Number(input.minutes) || 30));
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  list[idx] = {
    ...list[idx],
    status: 'snoozed',
    snooze_until: until,
    snooze_reason: String(input.reason || '').slice(0, 240) || undefined,
    snoozed_at: new Date().toISOString(),
    snoozed_by: actor,
  };
  writeCollection('agent-bridge-channels', list);
  appendAudit({
    actor,
    action: 'agent.channel_snooze',
    detail: `${list[idx].topic} · ${minutes}dk`,
    meta: { id: list[idx].id, minutes },
  });
  return { ok: true, channel: list[idx], overview: agentBridgeOverview() };
}

/** Snooze kanal uyandır */
export function wakeSnoozedAgentBridgeChannels(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-channels', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: true, woken: [], overview: agentBridgeOverview() };
  const limit = Math.max(1, Math.min(200, Number(input.limit) || 40));
  const force = !!input.force;
  const now = Date.now();
  const woken = [];
  for (let i = 0; i < list.length && woken.length < limit; i++) {
    const c = list[i];
    if (c.status !== 'snoozed') continue;
    if (input.id && c.id !== input.id) continue;
    const until = c.snooze_until ? new Date(c.snooze_until).getTime() : 0;
    if (!force && !input.id && until && until > now) continue;
    list[i] = {
      ...c,
      status: 'open',
      snooze_until: null,
      woken_at: new Date().toISOString(),
      woken_by: actor,
    };
    woken.push(list[i].id);
  }
  if (woken.length) {
    writeCollection('agent-bridge-channels', list);
    appendAudit({
      actor,
      action: 'agent.channel_wake',
      detail: `${woken.length} kanal`,
      meta: { n: woken.length },
    });
  }
  return { ok: true, woken, overview: agentBridgeOverview() };
}

/** Alert → campus WO veya fleet directive route */
export function routeAgentBridgeAlert(input = {}, actor = 'system') {
  const list = readCollection('agent-bridge-alerts', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Alert yok' };
  let idx = list.findIndex((a) => a.id === input.id && a.status === 'open');
  if (idx < 0) idx = list.findIndex((a) => a.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık alert yok' };
  const alert = list[idx];
  const mode = input.mode || (['green', 'greenpulse', 'stay', 'stayring', 'extreme'].includes(alert.domain) ? 'work_order' : 'fleet');
  let work_order = null;
  let directive = null;
  if (mode === 'work_order') {
    const zoneMap = {
      green: 'z_forest',
      greenpulse: 'z_forest',
      stay: 'z_glamp',
      stayring: 'z_glamp',
      extreme: 'z_sport',
      sport: 'z_sport',
      culture: 'z_culture',
      family: 'z_family',
      mall: 'z_mall',
      openmall: 'z_mall',
    };
    const wo = createCampusWorkOrder(
      {
        zone_id: input.zone_id || zoneMap[alert.domain] || 'z_sport',
        title: `Alert · ${alert.title}`,
        kind: 'bridge_alert',
        priority: alert.severity === 'critical' || alert.severity === 'high' ? 'high' : 'normal',
      },
      actor,
    );
    work_order = wo.work_order || null;
  } else {
    const d = dispatchFleetDirective(
      {
        title: `Route · ${alert.title}`,
        priority: alert.severity || 'high',
        agent: alert.agents?.[1],
        payload: { alert_id: alert.id, domain: alert.domain },
      },
      actor,
    );
    directive = d.directive || d || null;
  }
  const route = {
    id: rid('abar'),
    alert_id: alert.id,
    mode,
    work_order_id: work_order?.id || null,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('agent-bridge-alert-routes', route, 120);
  list[idx] = {
    ...alert,
    routed: true,
    route_mode: mode,
    route_id: route.id,
    work_order_id: work_order?.id || null,
    routed_at: route.at,
  };
  writeCollection('agent-bridge-alerts', list);
  appendAudit({
    actor,
    action: 'agent.alert_route',
    detail: `${alert.title} · ${mode}`,
    meta: { id: alert.id, route_id: route.id },
  });
  return {
    ok: true,
    alert: list[idx],
    route,
    work_order,
    directive,
    overview: agentBridgeOverview(),
  };
}
