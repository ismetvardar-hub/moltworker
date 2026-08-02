/**
 * LİKYA Holding — 28 ajan / 9 departman filo nabzı.
 * Kaynak: vizyon kadrosu (ajanlar paneli ile hizalı).
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { agentQueueOverview, enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

export const FLEET_DEPARTMENTS = [
  { id: 'executive', name: 'C-Suite & Stratejik Komuta' },
  { id: 'tech', name: 'Teknoloji, Bulut & Yazılım' },
  { id: 'supply', name: 'Satın Alma, Depo & Stok' },
  { id: 'legal', name: 'Hukuk, Uyum & Risk' },
  { id: 'sales', name: 'Satış, İş Geliştirme & CRM' },
  { id: 'creative', name: 'Kreatif, Medya & Pazarlama' },
  { id: 'hr', name: 'İnsan Kaynakları & Operasyon' },
  { id: 'finance', name: 'Finans, Fiyatlandırma & Borsa' },
  { id: 'rnd', name: 'AR-GE & Pazar İstihbaratı' },
];

/** 28 ajan — queue agent kodları UPPER */
export const FLEET = [
  { id: 'likya-1', code: 'LİKYA-1', name: 'LİKYA-1', role: 'CEO Orchestrator', department: 'executive', campus: true },
  { id: 'daze-hub', code: 'DAZE-HUB', name: 'DAZE-HUB', role: 'Merkezi Beyin & Borsa', department: 'executive', campus: true },
  { id: 'ethos', code: 'ETHOS', name: 'ETHOS', role: 'Ahlak & Nezaket Muhafızı', department: 'executive', campus: true },
  { id: 'atlas', code: 'ATLAS', name: 'ATLAS', role: 'Backend Architecture', department: 'tech', campus: false },
  { id: 'phaselis', code: 'PHASELIS', name: 'PHASELIS', role: 'Web Platform', department: 'tech', campus: false },
  { id: 'olympos-mobile', code: 'OLYMPOS-MOBILE', name: 'OLYMPOS-MOBILE', role: 'Mobil', department: 'tech', campus: false },
  { id: 'chimera', code: 'CHIMERA', name: 'CHIMERA', role: 'DevSecOps', department: 'tech', campus: false },
  { id: 'nexus', code: 'NEXUS', name: 'NEXUS', role: 'IoT & Donanım', department: 'tech', campus: true },
  { id: 'agora', code: 'AGORA', name: 'AGORA', role: 'Tedarik', department: 'supply', campus: false },
  { id: 'hephaestus', code: 'HEPHAESTUS', name: 'HEPHAESTUS', role: 'Depo & Stok', department: 'supply', campus: true },
  { id: 'logos', code: 'LOGOS', name: 'LOGOS', role: 'Lojistik & Soğuk Zincir', department: 'supply', campus: false },
  { id: 'themis', code: 'THEMIS', name: 'THEMIS', role: 'Hukuk', department: 'legal', campus: false },
  { id: 'valkyrie', code: 'VALKYRIE', name: 'VALKYRIE', role: 'KVKK & GDPR', department: 'legal', campus: false },
  { id: 'veritas', code: 'VERITAS', name: 'VERITAS', role: 'Marka & Telif', department: 'legal', campus: false },
  { id: 'hermes-sales', code: 'HERMES-SALES', name: 'HERMES-SALES', role: 'B2B Satış', department: 'sales', campus: false },
  { id: 'daze-vision', code: 'DAZE-VISION', name: 'DAZE-VISION', role: 'Müşteri Deneyimi', department: 'sales', campus: true },
  { id: 'reminder-ai', code: 'REMINDER-AI', name: 'REMINDER-AI', role: 'WhatsApp', department: 'sales', campus: true },
  { id: 'aura', code: 'AURA', name: 'AURA', role: 'Sadakat & Daze-Gift', department: 'sales', campus: false },
  { id: 'arte', code: 'ARTE', name: 'ARTE', role: 'Görsel', department: 'creative', campus: false },
  { id: 'prometheus', code: 'PROMETHEUS', name: 'PROMETHEUS', role: 'Video', department: 'creative', campus: false },
  { id: 'kalypso', code: 'KALYPSO', name: 'KALYPSO', role: 'Storyteller', department: 'creative', campus: true },
  { id: 'babel', code: 'BABEL', name: 'BABEL', role: 'Lokalizasyon', department: 'creative', campus: false },
  { id: 'daze-crew', code: 'DAZE-CREW', name: 'DAZE-CREW', role: 'Personel Portalı', department: 'hr', campus: false },
  { id: 'socrates', code: 'SOCRATES', name: 'SOCRATES', role: 'Nezaket Akademisi', department: 'hr', campus: false },
  { id: 'plutus', code: 'PLUTUS', name: 'PLUTUS', role: 'Bütçe & API Harcama', department: 'finance', campus: false },
  { id: 'mint', code: 'MINT', name: 'MINT', role: 'Borsa Algoritması', department: 'finance', campus: true },
  { id: 'herodot', code: 'HERODOT', name: 'HERODOT', role: 'Rakip İstihbaratı', department: 'rnd', campus: false },
  { id: 'odysseus', code: 'ODYSSEUS', name: 'ODYSSEUS', role: 'Yeni AI Teknolojileri', department: 'rnd', campus: false },
  // Kampüs uzantı ajanları (filo + operasyon)
  { id: 'life-coach-ai', code: 'LIFE-COACH-AI', name: 'LIFE-COACH-AI', role: 'Yaşam / performans', department: 'hr', campus: true, extension: true },
  { id: 'culture-ai', code: 'CULTURE-AI', name: 'CULTURE-AI', role: 'Sahne / bilet / yayın', department: 'creative', campus: true, extension: true },
  { id: 'sport-bridge', code: 'SPORT-BRIDGE', name: 'SPORT-BRIDGE', role: 'Park ↔ kulüp', department: 'sales', campus: true, extension: true },
  { id: 'gaia-esg', code: 'GAIA-ESG', name: 'GAIA-ESG', role: 'Yeşil / ESG', department: 'rnd', campus: true, extension: true },
];

export const FLEET_CODES = FLEET.map((a) => a.code);

function ensurePresence() {
  let list = readCollection('agent-presence', null);
  if (!Array.isArray(list) || !list.length) {
    list = FLEET.map((a) => ({
      code: a.code,
      status: a.campus || a.department === 'executive' ? 'online' : 'standby',
      last_ping: null,
    }));
    writeCollection('agent-presence', list);
  }
  return list;
}

function openAgentfleetFlags() {
  const flags = readCollection('agentfleet-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

export function agentFleetOverview() {
  const presence = ensurePresence();
  const queue = agentQueueOverview();
  const byCode = Object.fromEntries(presence.map((p) => [p.code, p]));
  const agents = FLEET.map((a) => {
    const q = queue.byAgent[a.code] || { queued: 0, running: 0, done: 0 };
    const p = byCode[a.code] || { status: 'standby' };
    let status = p.status;
    if (status === 'parked') {
      // parked kalır
    } else if (q.running > 0) status = 'busy';
    else if (q.queued > 0) status = 'queued';
    return {
      ...a,
      status,
      queue: q,
      last_ping: p.last_ping,
      parked_until: p.parked_until || null,
    };
  });
  const core28 = agents.filter((a) => !a.extension);
  const shifts = readCollection('fleet-shifts', []) || [];
  const shiftList = Array.isArray(shifts) ? shifts : [];
  const activeShift = shiftList.find((s) => s.status === 'active') || null;
  const handoffs = readCollection('fleet-handoffs', []) || [];
  const directives = readCollection('fleet-directives', []) || [];
  const directiveList = Array.isArray(directives) ? directives : [];
  const flags = openAgentfleetFlags();
  const now = Date.now();
  const stalePresence = agents.filter((a) => {
    if (a.status === 'parked') return false;
    const at = Date.parse(a.last_ping || 0);
    return !Number.isFinite(at) || now - at >= 60 * 60_000;
  });
  return {
    title: 'LİKYA Ajan Filosu',
    master_rule: 'Centilmenlik · Naiflik · Esprili Üslup',
    departments: FLEET_DEPARTMENTS,
    agents,
    core: core28,
    active_shift: activeShift,
    shifts: shiftList.slice(0, 15),
    handoffs: (Array.isArray(handoffs) ? handoffs : []).slice(0, 15),
    directives: directiveList.slice(0, 20),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: core28.length,
      extensions: agents.filter((a) => a.extension).length,
      online: agents.filter((a) => a.status === 'online' || a.status === 'busy' || a.status === 'queued').length,
      busy: agents.filter((a) => a.status === 'busy').length,
      standby: agents.filter((a) => a.status === 'standby').length,
      parked: agents.filter((a) => a.status === 'parked').length,
      stale_presence: stalePresence.length,
      campus_ops: agents.filter((a) => a.campus).length,
      queue_queued: queue.summary.queued,
      queue_running: queue.summary.running,
      shift_active: !!activeShift,
      directives_open: directiveList.filter((d) => d.status === 'open').length,
      directives_retired: directiveList.filter((d) => d.status === 'retired').length,
    },
    summaryLines: [
      `Filo ${core28.length} çekirdek · online ${agents.filter((a) => a.status === 'online' || a.status === 'busy' || a.status === 'queued').length} · park ${agents.filter((a) => a.status === 'parked').length}`,
      `Kuyruk ${queue.summary.queued}/${queue.summary.running} · stale presence ${stalePresence.length} · flag ${flags.length}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function pingFleetAgent(input = {}, actor = 'system') {
  const key = String(input.agent || input.code || 'DAZE-HUB');
  const normalized = FLEET.find(
    (a) => a.code === key || a.id === key || a.code.toLowerCase() === key.toLowerCase(),
  );
  if (!normalized) return { ok: false, error: 'Ajan yok' };
  const presence = ensurePresence();
  const idx = presence.findIndex((p) => p.code === normalized.code);
  const row = {
    code: normalized.code,
    status: 'online',
    last_ping: new Date().toISOString(),
    note: input.note || 'nabız',
    actor,
  };
  if (idx >= 0) presence[idx] = { ...presence[idx], ...row };
  else presence.push(row);
  writeCollection('agent-presence', presence);
  prependItem(
    'agent-pings',
    { id: rid('ap'), ...row },
    200,
  );
  appendAudit({
    actor,
    action: 'fleet.ping',
    detail: `${normalized.code}: ${row.note}`,
    meta: { code: normalized.code },
  });
  return { ok: true, agent: normalized.code, overview: agentFleetOverview() };
}

/** LİKYA-1 tarzı dağıtım: talimat → ilgili ajan kuyruğu */
export function dispatchFleetDirective(input = {}, actor = 'system') {
  const text = input.title || input.directive || 'Kampüs talimatı';
  const lower = text.toLowerCase();
  const targets = [];
  const push = (code) => {
    if (!targets.includes(code)) targets.push(code);
  };
  if (/hava|iptal|whatsapp|slot|waiver/.test(lower)) push('REMINDER-AI');
  if (/waiver|kiosk|misafir|nfc/.test(lower)) push('DAZE-VISION');
  if (/stok|hk|linen|depo|bakım|gear/.test(lower)) push('HEPHAESTUS');
  if (/fiyat|borsa|doluluk|f&b|fnb|kira/.test(lower)) push('MINT');
  if (/orman|esg|karbon|su|güneş|yeşil/.test(lower)) push('GAIA-ESG');
  if (/spor|antrenman|recovery|sporcu/.test(lower)) push('SPORT-BRIDGE');
  if (/yaşam|saat|wearable|recovery|uyku/.test(lower)) push('LIFE-COACH-AI');
  if (/sahne|bilet|konser|yayın|kültür/.test(lower)) push('CULTURE-AI');
  if (/iot|kapı|keyless|ışık/.test(lower)) push('NEXUS');
  if (/hukuk|kvkk|sözleşme/.test(lower)) push('THEMIS');
  if (/bütçe|maliyet|api/.test(lower)) push('PLUTUS');
  if (!targets.length) push(input.agent || 'DAZE-HUB');
  // ETHOS her zaman denetim kuyruğuna düşer (hafif)
  if (!targets.includes('ETHOS')) targets.push('ETHOS');

  const jobs = targets.map((agent) =>
    enqueueAgentJob(
      {
        agent,
        title: agent === 'ETHOS' ? `ETHOS denetim: ${text}` : text,
        priority: input.priority || (agent === 'REMINDER-AI' ? 'high' : 'normal'),
        payload: { ...(input.payload || {}), source: 'fleet.dispatch', targets },
      },
      actor,
    ),
  );
  const directive = {
    id: rid('fd'),
    title: text,
    targets,
    status: 'open',
    acks: [],
    at: new Date().toISOString(),
    actor,
  };
  prependItem('fleet-directives', directive, 200);
  appendAudit({
    actor,
    action: 'fleet.dispatch',
    detail: `${text} → ${targets.join(',')}`,
    meta: { targets, id: directive.id },
  });
  return {
    ok: true,
    targets,
    jobs: jobs.map((j) => j.job),
    directive,
    overview: agentFleetOverview(),
  };
}

/** Direktif ack — hedef ajan onayı */
export function acknowledgeFleetDirective(input = {}, actor = 'system') {
  const list = readCollection('fleet-directives', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Direktif yok' };
  let idx = list.findIndex((d) => d.id === input.id && d.status === 'open');
  if (idx < 0) idx = list.findIndex((d) => d.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık direktif yok' };
  const d = list[idx];
  const agent = input.agent || d.targets?.[0] || 'DAZE-HUB';
  const acks = Array.isArray(d.acks) ? [...d.acks] : [];
  if (!acks.includes(agent)) acks.push(agent);
  const allAcked = (d.targets || []).every((t) => acks.includes(t) || t === 'ETHOS');
  list[idx] = {
    ...d,
    acks,
    status: allAcked || input.close ? 'acked' : 'open',
    last_ack_at: new Date().toISOString(),
    last_ack_by: agent,
  };
  writeCollection('fleet-directives', list);
  appendAudit({
    actor,
    action: 'fleet.directive_ack',
    detail: `${d.title} · ${agent}`,
    meta: { id: d.id },
  });
  return { ok: true, directive: list[idx], overview: agentFleetOverview() };
}

/** Vardiya başlat — kampüs ajanları on-shift */
export function startFleetShift(input = {}, actor = 'system') {
  const shifts = readCollection('fleet-shifts', []) || [];
  const list = Array.isArray(shifts) ? [...shifts] : [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].status === 'active') {
      list[i] = { ...list[i], status: 'closed', closed_at: new Date().toISOString(), closed_by: actor };
    }
  }
  const campus = FLEET.filter((a) => a.campus).map((a) => a.code);
  const roster = Array.isArray(input.roster) && input.roster.length ? input.roster : campus;
  const shift = {
    id: rid('fsh'),
    name: input.name || `Vardiya ${new Date().toISOString().slice(11, 16)}`,
    roster,
    lead: input.lead || 'LİKYA-1',
    status: 'active',
    at: new Date().toISOString(),
    actor,
  };
  list.unshift(shift);
  writeCollection('fleet-shifts', list.slice(0, 120));
  sweepFleetPresence({ campus_only: true, note: `shift ${shift.name}` }, actor);
  enqueueAgentJob(
    {
      agent: 'LİKYA-1',
      title: `vardiya start · ${shift.name} · ${roster.length} ajan`,
      priority: 'normal',
      payload: { shift_id: shift.id, roster },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'fleet.shift_start',
    detail: shift.name,
    meta: { id: shift.id },
  });
  return { ok: true, shift, overview: agentFleetOverview() };
}

/** Vardiya handoff — not + sonraki lead */
export function handoffFleetShift(input = {}, actor = 'system') {
  const shifts = readCollection('fleet-shifts', []) || [];
  const list = Array.isArray(shifts) ? [...shifts] : [];
  let idx = list.findIndex((s) => s.id === input.shift_id && s.status === 'active');
  if (idx < 0) idx = list.findIndex((s) => s.status === 'active');
  if (idx < 0) {
    const started = startFleetShift({ name: 'Handoff seed' }, actor);
    return handoffFleetShift({ ...input, shift_id: started.shift?.id }, actor);
  }
  const from = list[idx];
  const toLead = input.to_lead || input.lead || 'DAZE-HUB';
  list[idx] = {
    ...from,
    status: 'handed_off',
    handed_off_at: new Date().toISOString(),
    to_lead: toLead,
  };
  const next = {
    id: rid('fsh'),
    name: input.name || `Handoff → ${toLead}`,
    roster: input.roster || from.roster,
    lead: toLead,
    status: 'active',
    from_shift: from.id,
    at: new Date().toISOString(),
    actor,
  };
  list.unshift(next);
  writeCollection('fleet-shifts', list.slice(0, 120));
  const handoff = {
    id: rid('fho'),
    from_shift: from.id,
    to_shift: next.id,
    from_lead: from.lead,
    to_lead: toLead,
    note: input.note || 'Vardiya devir',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('fleet-handoffs', handoff, 200);
  enqueueAgentJob(
    {
      agent: toLead,
      title: `handoff · ${from.name} → ${next.name}`,
      priority: 'high',
      payload: { handoff_id: handoff.id, note: handoff.note },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'fleet.handoff',
    detail: `${from.lead} → ${toLead}`,
    meta: { id: handoff.id },
  });
  return { ok: true, handoff, shift: next, overview: agentFleetOverview() };
}

/** Açık direktifi emekli et / iptal */
export function retireFleetDirective(input = {}, actor = 'system') {
  const list = readCollection('fleet-directives', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Direktif yok' };
  let idx = list.findIndex((d) => d.id === input.id && d.status === 'open');
  if (idx < 0) idx = list.findIndex((d) => d.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık direktif yok' };
  list[idx] = {
    ...list[idx],
    status: 'retired',
    retire_reason: String(input.reason || 'retired').slice(0, 240) || 'retired',
    retired_at: new Date().toISOString(),
    retired_by: actor,
  };
  writeCollection('fleet-directives', list);
  appendAudit({
    actor,
    action: 'fleet.directive_retire',
    detail: list[idx].title,
    meta: { id: list[idx].id },
  });
  return { ok: true, directive: list[idx], overview: agentFleetOverview() };
}

/** Ajanı park et — yeni iş almaz (presence=parked) */
export function parkFleetAgent(input = {}, actor = 'system') {
  const key = String(input.agent || input.code || '');
  const normalized = FLEET.find(
    (a) => a.code === key || a.id === key || a.code.toLowerCase() === key.toLowerCase(),
  );
  if (!normalized) return { ok: false, error: 'Ajan yok' };
  const minutes = Math.max(1, Math.min(24 * 60, Number(input.minutes) || 60));
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  const presence = ensurePresence();
  const idx = presence.findIndex((p) => p.code === normalized.code);
  const row = {
    code: normalized.code,
    status: 'parked',
    parked_until: until,
    park_reason: String(input.reason || '').slice(0, 240) || undefined,
    parked_at: new Date().toISOString(),
    parked_by: actor,
    last_ping: new Date().toISOString(),
    note: input.note || 'parked',
    actor,
  };
  if (idx >= 0) presence[idx] = { ...presence[idx], ...row };
  else presence.push(row);
  writeCollection('agent-presence', presence);
  appendAudit({
    actor,
    action: 'fleet.park',
    detail: `${normalized.code} · ${minutes}dk`,
    meta: { code: normalized.code, minutes },
  });
  return { ok: true, agent: normalized.code, presence: row, overview: agentFleetOverview() };
}

/** Park süresi dolan / force unpark */
export function unparkFleetAgents(input = {}, actor = 'system') {
  const presence = ensurePresence();
  const limit = Math.max(1, Math.min(200, Number(input.limit) || 40));
  const force = !!input.force;
  const now = Date.now();
  const unparked = [];
  for (let i = 0; i < presence.length && unparked.length < limit; i++) {
    const p = presence[i];
    if (p.status !== 'parked') continue;
    if (input.agent && p.code !== input.agent && p.code?.toLowerCase() !== String(input.agent).toLowerCase()) {
      continue;
    }
    const until = p.parked_until ? new Date(p.parked_until).getTime() : 0;
    if (!force && !input.agent && until && until > now) continue;
    presence[i] = {
      ...p,
      status: 'online',
      parked_until: null,
      unparked_at: new Date().toISOString(),
      unparked_by: actor,
      last_ping: new Date().toISOString(),
      note: 'unparked',
    };
    unparked.push(presence[i].code);
  }
  if (unparked.length) {
    writeCollection('agent-presence', presence);
    appendAudit({
      actor,
      action: 'fleet.unpark',
      detail: `${unparked.length} ajan`,
      meta: { n: unparked.length },
    });
  }
  return { ok: true, unparked, overview: agentFleetOverview() };
}

/** Kuyruk yüküne göre hafif dengele — boş ajanlara seed job */
export function runFleetLoadBalance(input = {}, actor = 'system') {
  unparkFleetAgents({ limit: 20 }, actor);
  const overview = agentFleetOverview();
  const campus = (overview.agents || []).filter((a) => a.campus && a.status !== 'parked');
  if (!campus.length) return { ok: false, error: 'Kampüs ajanı yok' };
  const loads = campus.map((a) => ({
    code: a.code,
    load: (a.queue?.queued || 0) + (a.queue?.running || 0) * 2,
  }));
  const avg = loads.reduce((s, x) => s + x.load, 0) / loads.length;
  const heavy = loads.filter((x) => x.load > avg + 1).sort((a, b) => b.load - a.load);
  const light = loads.filter((x) => x.load <= avg).sort((a, b) => a.load - b.load);
  const seeded = [];
  const n = Math.min(Number(input.limit) || 3, light.length, Math.max(1, heavy.length || 1));
  for (let i = 0; i < n && i < light.length; i++) {
    const agent = light[i].code;
    const job = enqueueAgentJob(
      {
        agent,
        title: input.title || `load-balance · ${agent}`,
        priority: 'normal',
        payload: { source: 'fleet.load_balance', avg_load: Math.round(avg * 10) / 10 },
      },
      actor,
    );
    seeded.push(job.job?.id || agent);
  }
  const run = {
    id: rid('flb'),
    avg_load: Math.round(avg * 10) / 10,
    heavy: heavy.slice(0, 5).map((h) => h.code),
    light: light.slice(0, 5).map((l) => l.code),
    seeded: seeded.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('fleet-load-balances', run, 80);
  appendAudit({
    actor,
    action: 'fleet.load_balance',
    detail: `seed ${seeded.length} · avg ${run.avg_load}`,
    meta: { id: run.id },
  });
  return { ok: true, run, seeded, overview: agentFleetOverview() };
}

export function runAgentfleetSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const before = agentFleetOverview();
  const existing = readCollection('agentfleet-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  const orchestration = {
    unpark: unparkFleetAgents({ limit: input.limit || 40, force }, actor),
    presence: sweepFleetPresence({ campus_only: input.campus_only !== false, force, note: 'agentfleet sweep' }, actor),
    load_balance: null,
  };
  const afterPresence = agentFleetOverview();
  if (
    force ||
    Number(afterPresence.summary?.queue_queued || 0) > 0 ||
    Number(afterPresence.summary?.queue_running || 0) > 0
  ) {
    orchestration.load_balance = runFleetLoadBalance({ limit: input.balance_limit || 2, title: input.title }, actor);
  }
  const overview = agentFleetOverview();
  if (force || (before.summary?.stale_presence || 0) > 0 || orchestration.presence?.updated > 0) {
    candidates.push({
      key: 'agentfleet_presence_stale',
      level: (before.summary?.stale_presence || 0) > 0 ? 'warn' : 'info',
      text: `Stale presence ${before.summary?.stale_presence || 0} · updated ${orchestration.presence?.updated || 0}`,
      domain: 'presence',
    });
  }
  if (force || (overview.summary?.parked || 0) > 0 || (orchestration.unpark?.unparked || []).length > 0) {
    candidates.push({
      key: 'agentfleet_parked_agents',
      level: (overview.summary?.parked || 0) > 0 ? 'warn' : 'info',
      text: `Parked ajan ${overview.summary?.parked || 0} · unpark ${(orchestration.unpark?.unparked || []).length}`,
      domain: 'parking',
    });
  }
  if (force || (overview.summary?.queue_queued || 0) > 0 || (overview.summary?.directives_open || 0) > 0) {
    candidates.push({
      key: 'agentfleet_dispatch_pressure',
      level: (overview.summary?.queue_queued || 0) > 5 ? 'alert' : 'warn',
      text: `Kuyruk ${overview.summary?.queue_queued || 0}/${overview.summary?.queue_running || 0} · direktif ${overview.summary?.directives_open || 0}`,
      domain: 'dispatch',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('aff'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('agentfleet-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'LİKYA-1',
        title: `agentfleet sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('afs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('agentfleet-sweeps', sweep, 80);
  appendAudit({ actor, action: 'agentfleet.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, orchestration, overview: agentFleetOverview() };
}

export function ackAgentfleetFlag(input = {}, actor = 'system') {
  const list = readCollection('agentfleet-flags', []) || [];
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
  writeCollection('agentfleet-flags', list);
  appendAudit({ actor, action: 'agentfleet.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: agentFleetOverview() };
}

/** Aktif vardiyayı kapat (handoff olmadan) */
export function closeFleetShift(input = {}, actor = 'system') {
  const shifts = readCollection('fleet-shifts', []) || [];
  const list = Array.isArray(shifts) ? [...shifts] : [];
  let idx = list.findIndex((s) => s.id === input.shift_id && s.status === 'active');
  if (idx < 0) idx = list.findIndex((s) => s.status === 'active');
  if (idx < 0) return { ok: false, error: 'Aktif vardiya yok' };
  list[idx] = {
    ...list[idx],
    status: 'closed',
    close_reason: String(input.reason || 'closed').slice(0, 240) || 'closed',
    closed_at: new Date().toISOString(),
    closed_by: actor,
  };
  writeCollection('fleet-shifts', list);
  enqueueAgentJob(
    {
      agent: list[idx].lead || 'LİKYA-1',
      title: `vardiya close · ${list[idx].name}`,
      priority: 'normal',
      payload: { shift_id: list[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'fleet.shift_close',
    detail: list[idx].name,
    meta: { id: list[idx].id },
  });
  return { ok: true, shift: list[idx], overview: agentFleetOverview() };
}

/** Kampüs ajanlarına toplu presence nabız */
export function sweepFleetPresence(input = {}, actor = 'system') {
  const campusOnly = input.campus_only !== false;
  const targets = FLEET.filter((a) => (campusOnly ? a.campus : true));
  const presence = ensurePresence();
  const now = new Date().toISOString();
  let updated = 0;
  for (const a of targets) {
    const idx = presence.findIndex((p) => p.code === a.code);
    const existing = idx >= 0 ? presence[idx] : null;
    // parked ajanları sweep bozmasın (süre dolmadıysa)
    if (existing?.status === 'parked') {
      const until = existing.parked_until ? new Date(existing.parked_until).getTime() : 0;
      if (until && until > Date.now() && !input.force) continue;
    }
    const row = {
      code: a.code,
      status: 'online',
      last_ping: now,
      note: input.note || 'fleet sweep',
      parked_until: null,
      actor,
    };
    if (idx >= 0) presence[idx] = { ...presence[idx], ...row };
    else presence.push(row);
    updated++;
  }
  writeCollection('agent-presence', presence);
  prependItem(
    'agent-pings',
    { id: rid('aps'), kind: 'sweep', n: updated, campus_only: campusOnly, at: now, actor },
    200,
  );
  appendAudit({
    actor,
    action: 'fleet.presence_sweep',
    detail: `${updated} ajan · campus_only=${campusOnly}`,
    meta: { n: updated },
  });
  return { ok: true, updated, overview: agentFleetOverview() };
}
