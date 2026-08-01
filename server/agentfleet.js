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

export function agentFleetOverview() {
  const presence = ensurePresence();
  const queue = agentQueueOverview();
  const byCode = Object.fromEntries(presence.map((p) => [p.code, p]));
  const agents = FLEET.map((a) => {
    const q = queue.byAgent[a.code] || { queued: 0, running: 0, done: 0 };
    const p = byCode[a.code] || { status: 'standby' };
    let status = p.status;
    if (q.running > 0) status = 'busy';
    else if (q.queued > 0) status = 'queued';
    return {
      ...a,
      status,
      queue: q,
      last_ping: p.last_ping,
    };
  });
  const core28 = agents.filter((a) => !a.extension);
  const shifts = readCollection('fleet-shifts', []) || [];
  const shiftList = Array.isArray(shifts) ? shifts : [];
  const activeShift = shiftList.find((s) => s.status === 'active') || null;
  const handoffs = readCollection('fleet-handoffs', []) || [];
  const directives = readCollection('fleet-directives', []) || [];
  return {
    title: 'LİKYA Ajan Filosu',
    master_rule: 'Centilmenlik · Naiflik · Esprili Üslup',
    departments: FLEET_DEPARTMENTS,
    agents,
    core: core28,
    active_shift: activeShift,
    shifts: shiftList.slice(0, 15),
    handoffs: (Array.isArray(handoffs) ? handoffs : []).slice(0, 15),
    directives: (Array.isArray(directives) ? directives : []).slice(0, 20),
    summary: {
      total: core28.length,
      extensions: agents.filter((a) => a.extension).length,
      online: agents.filter((a) => a.status === 'online' || a.status === 'busy' || a.status === 'queued').length,
      busy: agents.filter((a) => a.status === 'busy').length,
      standby: agents.filter((a) => a.status === 'standby').length,
      campus_ops: agents.filter((a) => a.campus).length,
      queue_queued: queue.summary.queued,
      queue_running: queue.summary.running,
      shift_active: !!activeShift,
      directives_open: (Array.isArray(directives) ? directives : []).filter((d) => d.status === 'open').length,
    },
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

/** Kampüs ajanlarına toplu presence nabız */
export function sweepFleetPresence(input = {}, actor = 'system') {
  const campusOnly = input.campus_only !== false;
  const targets = FLEET.filter((a) => (campusOnly ? a.campus : true));
  const presence = ensurePresence();
  const now = new Date().toISOString();
  let updated = 0;
  for (const a of targets) {
    const idx = presence.findIndex((p) => p.code === a.code);
    const row = {
      code: a.code,
      status: 'online',
      last_ping: now,
      note: input.note || 'fleet sweep',
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
