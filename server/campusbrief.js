/**
 * CEO sabah brifi — tüm kampüs nabızları + aksiyon listesi.
 */
import { appendAudit } from './audit.js';
import { readCollection } from './store.js';
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

function hasOpenJob(agent, titleIncludes) {
  const jobs = readCollection('agent-jobs', []) || [];
  return (Array.isArray(jobs) ? jobs : []).some(
    (j) =>
      (j.status === 'queued' || j.status === 'running') &&
      j.agent === agent &&
      String(j.title || '').includes(titleIncludes),
  );
}

/** Çapraz otomasyon: hava / ESG / HK / F&B → ajan kuyruğu */
export function runCampusAutomations(actor = 'system') {
  const actions = [];
  const extreme = extremeOverview();
  const green = greenPulseOverview();
  const stay = stayRingOverview();
  const mall = openMallOverview();
  const life = lifeCoachOverview();

  if ((extreme.summary?.cancelled_slots || 0) > 0 && !hasOpenJob('REMINDER-AI', 'hava iptal')) {
    const r = enqueueAgentJob(
      {
        agent: 'REMINDER-AI',
        title: `hava iptal: ${extreme.summary.cancelled_slots} slot — WA takip`,
        priority: 'high',
        payload: { cancelled: extreme.summary.cancelled_slots, weather: extreme.weather?.condition },
      },
      actor,
    );
    actions.push({ type: 'weather', job: r.job?.id });
  }

  if ((extreme.summary?.waiver_pending || 0) > 0 && !hasOpenJob('DAZE-VISION', 'waiver')) {
    const r = enqueueAgentJob(
      {
        agent: 'DAZE-VISION',
        title: `waiver bekleyen ${extreme.summary.waiver_pending} üye`,
        priority: 'normal',
        payload: { pending: extreme.summary.waiver_pending },
      },
      actor,
    );
    actions.push({ type: 'waiver', job: r.job?.id });
  }

  if ((green.summary?.alerts || 0) > 0 && !hasOpenJob('GAIA-ESG', 'ESG alert')) {
    const r = enqueueAgentJob(
      {
        agent: 'GAIA-ESG',
        title: `ESG alert ×${green.summary.alerts} — skor ${green.summary.score}`,
        priority: green.summary.alerts >= 2 ? 'high' : 'normal',
        payload: { score: green.summary.score, alerts: green.summary.alerts },
      },
      actor,
    );
    actions.push({ type: 'green', job: r.job?.id });
  }

  if ((stay.summary?.hk_dirty || 0) > 0 && !hasOpenJob('HEPHAESTUS', 'HK dirty')) {
    const r = enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `HK dirty ×${stay.summary.hk_dirty} — linen/turnover`,
        priority: 'normal',
        payload: { hk_dirty: stay.summary.hk_dirty },
      },
      actor,
    );
    actions.push({ type: 'hk', job: r.job?.id });
  }

  if ((mall.summary?.fnb_gap_total || 0) > 50000 && !hasOpenJob('MINT', 'F&B gap')) {
    const r = enqueueAgentJob(
      {
        agent: 'MINT',
        title: `F&B gap ${mall.summary.fnb_gap_total} TRY — asgari takip`,
        priority: 'normal',
        payload: { gap: mall.summary.fnb_gap_total, met: mall.summary.fnb_met },
      },
      actor,
    );
    actions.push({ type: 'fnb', job: r.job?.id });
  }

  if ((life.summary?.flags || 0) > 0 && !hasOpenJob('LIFE-COACH-AI', 'Flag')) {
    const r = enqueueAgentJob(
      {
        agent: 'LIFE-COACH-AI',
        title: `Flag brifing ×${life.summary.flags}`,
        priority: 'normal',
        payload: { flags: life.summary.flags },
      },
      actor,
    );
    actions.push({ type: 'life', job: r.job?.id });
  }

  if (actions.length) {
    appendAudit({
      actor,
      action: 'campus.auto',
      detail: `${actions.length} otomasyon`,
      meta: { n: actions.length },
    });
  }
  return { ok: true, actions };
}

/** Ops / readiness için kampüs sağlık skoru */
export function campusHealthCheck() {
  const brief = campusBriefOverview('health');
  const alerts = (brief.actions || []).filter((a) => a.level === 'alert').length;
  const warns = (brief.actions || []).filter((a) => a.level === 'warn').length;
  const score = Math.max(0, 100 - alerts * 15 - warns * 5);
  const status = score >= 80 ? 'healthy' : score >= 55 ? 'degraded' : 'unhealthy';
  return {
    status,
    score,
    alerts,
    warns,
    actions: brief.actions,
    pulses: brief.pulses,
    generatedAt: new Date().toISOString(),
  };
}

export function campusBriefOverview(actor = 'system') {
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

  const actions = [];
  if (extreme.summary?.waiver_pending) {
    actions.push({ level: 'warn', text: `${extreme.summary.waiver_pending} waiver imza bekliyor`, href: 'extremepark' });
  }
  if (extreme.summary?.cancelled_slots) {
    actions.push({ level: 'alert', text: `${extreme.summary.cancelled_slots} slot hava iptali`, href: 'extremepark' });
  }
  if (life.summary?.flags) {
    actions.push({ level: 'warn', text: `${life.summary.flags} yaşam bayrağı`, href: 'lifecoach' });
  }
  if (green.summary?.alerts) {
    actions.push({ level: 'alert', text: `ESG ${green.summary.alerts} alert · skor ${green.summary.score}`, href: 'greenpulse' });
  }
  if (stay.summary?.hk_dirty) {
    actions.push({ level: 'info', text: `${stay.summary.hk_dirty} ünite HK bekliyor`, href: 'stayring' });
  }
  if (mall.summary?.fnb_gap_total > 0) {
    actions.push({
      level: 'info',
      text: `F&B asgari gap ${mall.summary.fnb_gap_total} TRY`,
      href: 'openmall',
    });
  }
  if (queue.summary?.queued) {
    actions.push({ level: 'info', text: `${queue.summary.queued} ajan işi kuyrukta`, href: 'agentqueue' });
  }
  if (culture.summary?.live) {
    actions.push({ level: 'ok', text: `${culture.summary.live} canlı sahne/yayın`, href: 'culturescene' });
  }

  return {
    title: 'CEO Kampüs Brifi',
    ethos: 'Orman önce · sporla beslenen destinasyon · ETHOS güler.',
    headline: `${campus.title || 'LİKYA Kampüs'} — ${new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    actions,
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
    weather: extreme.weather || null,
    generatedAt: new Date().toISOString(),
    actor,
  };
}
