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
  return {
    title: 'LİKYA Ajan Filosu',
    master_rule: 'Centilmenlik · Naiflik · Esprili Üslup',
    departments: FLEET_DEPARTMENTS,
    agents,
    core: core28,
    summary: {
      total: core28.length,
      extensions: agents.filter((a) => a.extension).length,
      online: agents.filter((a) => a.status === 'online' || a.status === 'busy' || a.status === 'queued').length,
      busy: agents.filter((a) => a.status === 'busy').length,
      standby: agents.filter((a) => a.status === 'standby').length,
      campus_ops: agents.filter((a) => a.campus).length,
      queue_queued: queue.summary.queued,
      queue_running: queue.summary.running,
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
  appendAudit({
    actor,
    action: 'fleet.dispatch',
    detail: `${text} → ${targets.join(',')}`,
    meta: { targets },
  });
  return {
    ok: true,
    targets,
    jobs: jobs.map((j) => j.job),
    overview: agentFleetOverview(),
  };
}
