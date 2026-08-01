/**
 * Adım 9 — Ajan komuta köprüsü: tek hub sinyali.
 */
import { appendAudit } from './audit.js';
import { campusCoreOverview } from './campuscore.js';
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
    channels: chList.filter((c) => c.status === 'open').slice(0, 20),
    alerts: alertList.filter((a) => a.status === 'open').slice(0, 20),
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
      alerts_open: alertList.filter((a) => a.status === 'open').length,
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
  let idx = list.findIndex((a) => a.id === input.id && a.status === 'open');
  if (idx < 0) idx = list.findIndex((a) => a.status === 'open');
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
