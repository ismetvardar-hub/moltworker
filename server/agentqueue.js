/**
 * Ajan iş kuyruğu — komuta talimatları, claim / complete / fail.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

/** 28 çekirdek + kampüs uzantıları — agentfleet ile hizalı */
const AGENTS = [
  'LİKYA-1',
  'DAZE-HUB',
  'ETHOS',
  'ATLAS',
  'PHASELIS',
  'OLYMPOS-MOBILE',
  'CHIMERA',
  'NEXUS',
  'AGORA',
  'HEPHAESTUS',
  'LOGOS',
  'THEMIS',
  'VALKYRIE',
  'VERITAS',
  'HERMES-SALES',
  'DAZE-VISION',
  'REMINDER-AI',
  'AURA',
  'ARTE',
  'PROMETHEUS',
  'KALYPSO',
  'BABEL',
  'DAZE-CREW',
  'SOCRATES',
  'PLUTUS',
  'MINT',
  'HERODOT',
  'ODYSSEUS',
  'LIFE-COACH-AI',
  'CULTURE-AI',
  'SPORT-BRIDGE',
  'GAIA-ESG',
];

function ensureQueue() {
  let list = readCollection('agent-jobs', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      {
        id: 'aj_1',
        agent: 'REMINDER-AI',
        title: 'Paragliding slot hava uyarısı',
        priority: 'high',
        status: 'queued',
        payload: { branch: 'paragliding' },
        at: new Date().toISOString(),
      },
      {
        id: 'aj_2',
        agent: 'MINT',
        title: 'Hafta sonu glamping fiyat güncelle',
        priority: 'normal',
        status: 'queued',
        payload: { uplift_pct: 12 },
        at: new Date().toISOString(),
      },
      {
        id: 'aj_3',
        agent: 'HEPHAESTUS',
        title: 'SUP board servis kontrol',
        priority: 'normal',
        status: 'running',
        claimed_by: 'HEPHAESTUS',
        payload: { gear: 'SUP-01' },
        at: new Date().toISOString(),
      },
    ];
    writeCollection('agent-jobs', list);
  }
  return list;
}

export function agentQueueOverview() {
  const jobs = ensureQueue();
  const byAgent = {};
  for (const a of AGENTS) {
    byAgent[a] = {
      queued: jobs.filter((j) => j.agent === a && j.status === 'queued').length,
      running: jobs.filter((j) => j.agent === a && j.status === 'running').length,
      done: jobs.filter((j) => j.agent === a && j.status === 'done').length,
    };
  }
  return {
    title: 'Ajan İş Kuyruğu',
    ethos: 'Talimat girer · ajan claim eder · ETHOS güler.',
    agents: AGENTS,
    jobs: jobs.slice(0, 50),
    byAgent,
    summary: {
      queued: jobs.filter((j) => j.status === 'queued').length,
      running: jobs.filter((j) => j.status === 'running').length,
      done: jobs.filter((j) => j.status === 'done').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function enqueueAgentJob(input = {}, actor = 'system') {
  const agent = AGENTS.includes(input.agent) ? input.agent : 'DAZE-HUB';
  const row = {
    id: rid('aj'),
    agent,
    title: input.title || 'Komuta talimatı',
    priority: input.priority || 'normal',
    status: 'queued',
    payload: input.payload || {},
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('agent-jobs', row, 400);
  appendAudit({ actor, action: 'agent.enqueue', detail: `${agent}: ${row.title}`, meta: { id: row.id } });
  return { ok: true, job: row, overview: agentQueueOverview() };
}

export function claimAgentJob(input = {}, actor = 'system') {
  const jobs = ensureQueue();
  let idx = -1;
  if (input.id) idx = jobs.findIndex((j) => j.id === input.id && j.status === 'queued');
  if (idx < 0) {
    idx = jobs.findIndex(
      (j) => j.status === 'queued' && (!input.agent || j.agent === input.agent),
    );
  }
  if (idx < 0) return { ok: false, error: 'Kuyrukta iş yok' };
  jobs[idx] = {
    ...jobs[idx],
    status: 'running',
    claimed_by: input.agent || jobs[idx].agent,
    claimed_at: new Date().toISOString(),
    claimed_actor: actor,
  };
  writeCollection('agent-jobs', jobs);
  appendAudit({
    actor,
    action: 'agent.claim',
    detail: `${jobs[idx].agent}: ${jobs[idx].title}`,
    meta: { id: jobs[idx].id },
  });
  return { ok: true, job: jobs[idx], overview: agentQueueOverview() };
}

export function completeAgentJob(input = {}, actor = 'system') {
  const jobs = ensureQueue();
  const idx = jobs.findIndex((j) => j.id === input.id);
  if (idx < 0) return { ok: false, error: 'İş yok' };
  const status = input.fail ? 'failed' : 'done';
  jobs[idx] = {
    ...jobs[idx],
    status,
    result: input.result || (input.fail ? input.error || 'failed' : 'ok'),
    completed_at: new Date().toISOString(),
    completed_by: actor,
  };
  writeCollection('agent-jobs', jobs);
  appendAudit({
    actor,
    action: input.fail ? 'agent.fail' : 'agent.complete',
    detail: `${jobs[idx].agent}: ${jobs[idx].title}`,
    meta: { id: jobs[idx].id },
  });
  return { ok: true, job: jobs[idx], overview: agentQueueOverview() };
}

/**
 * Tick (jobs ticker ile):
 * 1) bir queued iş claim
 * 2) 15sn+ running işleri auto-complete
 */
export function tickAgentQueue(actor = 'system') {
  const jobs = ensureQueue();
  let claimed = 0;
  let completed = 0;
  const now = Date.now();

  const hasRunning = jobs.some((j) => j.status === 'running');
  if (!hasRunning) {
    const qidx = jobs.findIndex((j) => j.status === 'queued');
    if (qidx >= 0) {
      jobs[qidx] = {
        ...jobs[qidx],
        status: 'running',
        claimed_by: jobs[qidx].agent,
        claimed_at: new Date().toISOString(),
        claimed_actor: actor,
      };
      claimed = 1;
    }
  }

  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (j.status !== 'running') continue;
    const started = j.claimed_at || j.at;
    if (!started) {
      jobs[i] = { ...j, claimed_at: new Date().toISOString() };
      continue;
    }
    const age = now - new Date(started).getTime();
    if (age > 15_000) {
      jobs[i] = {
        ...j,
        status: 'done',
        result: 'auto-tick',
        completed_at: new Date().toISOString(),
      };
      completed++;
    }
  }

  if (claimed || completed) writeCollection('agent-jobs', jobs);
  if (claimed || completed) {
    appendAudit({
      actor,
      action: 'agent.tick',
      detail: `claim ${claimed} · done ${completed}`,
      meta: { claimed, completed },
    });
  }
  return { ok: true, claimed, completed, overview: agentQueueOverview() };
}
