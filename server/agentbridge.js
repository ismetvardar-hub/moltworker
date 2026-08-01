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
import { agentQueueOverview } from './agentqueue.js';
import { greenPulseOverview } from './greenpulse.js';
import { agentFleetOverview, pingFleetAgent } from './agentfleet.js';

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

  return {
    title: 'Ajan Komuta Köprüsü',
    ethos: 'ETHOS güler · ajanlar çalışır · orman dinlenir.',
    master_rule: fleet.master_rule,
    agents,
    fleet: fleet.summary,
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
