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

  const agents = [
    { id: 'NEXUS', role: 'IoT / kapı / ışık / NFC', signal: `keys ${stay.summary.keys_active || 0} · slots ${extreme.summary?.open_slots ?? '?'}`, status: 'online' },
    { id: 'HEPHAESTUS', role: 'Depo / zimmet / bakım', signal: `gear service ${extreme.summary?.gear_service || 0} · q ${queue.byAgent['HEPHAESTUS']?.queued || 0}`, status: 'online' },
    { id: 'REMINDER-AI', role: 'WhatsApp / iptal / slot', signal: `weather ${extreme.weather?.condition || '?'} · q ${queue.byAgent['REMINDER-AI']?.queued || 0}`, status: 'online' },
    { id: 'MINT', role: 'Dinamik fiyat / doluluk', signal: `stay free ${stay.summary.free} · HK ${stay.summary.hk_dirty || 0}`, status: 'online' },
    { id: 'DAZE-VISION', role: 'Kiosk / waiver / MaaS', signal: `waiver pending ${extreme.summary?.waiver_pending || 0}`, status: 'online' },
    { id: 'DAZE-HUB', role: 'Komuta paneli', signal: `zones ${campus.summary.active} · queue ${queue.summary.queued}`, status: 'online' },
    { id: 'LIFE-COACH-AI', role: 'Yaşam / performans asistanı', signal: `flags ${life.summary.flags} · hooks ${life.summary.webhook_events || 0}`, status: 'online' },
    { id: 'CULTURE-AI', role: 'Sahne / bilet / yayın', signal: `live ${culture.summary.live} · held ${culture.summary.tickets_held}`, status: 'online' },
    { id: 'SPORT-BRIDGE', role: 'Park ↔ kulüp', signal: `linked ${sport.summary.linked} · gaps ${sport.summary.waiver_gaps}`, status: 'online' },
    { id: 'GAIA-ESG', role: 'Yeşil / ESG', signal: `score ${green.summary.score} · alerts ${green.summary.alerts}`, status: 'online' },
  ];

  return {
    title: 'Ajan Komuta Köprüsü',
    ethos: 'ETHOS güler · ajanlar çalışır · orman dinlenir.',
    agents,
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
    },
    generatedAt: new Date().toISOString(),
  };
}

export function agentBridgePing(input = {}, actor = 'system') {
  const agent = input.agent || 'DAZE-HUB';
  appendAudit({
    actor,
    action: 'agent.ping',
    detail: `${agent}: ${input.note || 'nabız'}`,
    meta: { agent },
  });
  return { ok: true, agent, overview: agentBridgeOverview() };
}
