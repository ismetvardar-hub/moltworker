import { useMemo, useState } from 'react';
import { Bot, CircleDot, ShieldCheck, Terminal } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { AGENTS, DEPARTMENTS, MASTER_RULE, agentsByDepartment } from '../data/agents';
import { useTypewriter } from '../hooks/useTypewriter';
import type { AgentState, DepartmentId } from '../types';

const STATE_STYLE: Record<AgentState, string> = {
  aktif: 'text-emerald-300',
  beklemede: 'text-amber-300',
  hata: 'text-rose-300',
};

const STREAMS: Record<DepartmentId, string[]> = {
  executive: [
    '[LİKYA-1] CEO talimatı alındı: yaz sezonu lansmanı → 6 departmana bölündü',
    '[DAZE-HUB] mutfak stok akışı: 14 reçete güncel · maliyet sapması %1.2',
    '[DAZE-HUB] borsa algoritması: öğle yoğunluğu fiyat esnetmesi devrede',
    '[ETHOS] 38 prompt denetlendi: 38 centilmen ✓ · 0 engelleme',
    '[ETHOS] REMINDER-AI şablonundaki espri onaylandı: "naif ve zarif" ✓',
    '[LİKYA-1] filo durumu: 21 aktif · 5 beklemede · 0 hata ✓',
  ],
  tech: [
    '[LİKYA-1] görev: POST /api/pass/verify uç noktası → ATLAS',
    'router.post("/api/pass/verify", async (req, res) => {',
    '  const { code, gateId } = req.body;',
    '  const result = await verifyPassCode(code, gateId);',
    '  return res.json({ holder: result.holder, tier: result.tier });',
    '});',
    '[ATLAS] birim testleri: 8/8 geçti ✓',
    '[PHASELIS] CEO panel bileşeni güncellendi: <PassVerifyCard />',
    '[OLYMPOS-MOBILE] Flutter cüzdan modülü: qr_scanner v2 entegre',
    '[NEXUS] ESP32 turnike firmware v1.4 yüklendi · RFID okuma 42ms',
    '[CHIMERA] OWASP taraması: kritik bulgu yok ✓',
  ],
  supply: [
    '[AGORA] 3 tedarikçiden fiyat teklifi toplandı: en iyi teklif %8 altında',
    '[AGORA] otonom sipariş taslağı hazır → CEO onayına sunuldu',
    '[HEPHAESTUS] Daze Chef: köfte reçetesi stoğu kritik seviyede (%12)',
    '[HEPHAESTUS] re-order sinyali çekildi → AGORA bilgilendirildi ✓',
    '[LOGOS] soğuk zincir rotası optimize edildi: 4 durak · 38 dk',
    '[LOGOS] termal koruma: 2 dk kuralını aşan 1 ürün korumaya alındı ✓',
  ],
  legal: [
    '[THEMIS] tedarikçi sözleşmesi taslağı hazır: 14 madde · rev.2',
    '[THEMIS] NDA gizlilik metni güncellendi (Daze Vision pilotu)',
    '[VALKYRIE] QR geçiş verisi KVKK denetimi: uyumlu ✓',
    '[VALKYRIE] GDPR raporu: biyometrik veri saklama süresi 30 güne indirildi',
    '[VERITAS] "Daze Mind" marka tescil başvurusu: sınıf 9 ve 42 ✓',
    '[VERITAS] yazılım lisans envanteri güncellendi: 0 ihlal',
  ],
  sales: [
    '[HERMES-SALES] kurumsal paket teklifi hazırlandı: Marina Grup · 250 kart',
    '[DAZE-VISION] yaşam koçu modülü: buzdolabı analizi 3 öneri üretti',
    '[REMINDER-AI] WhatsApp: "Siparişiniz hazır! ☕ Kahveniz sizi özlüyor…"',
    '[REMINDER-AI] 2 dk doldu → ürün termal korumaya alındı, nazik hatırlatma gitti',
    '[AURA] Daze-Gift: 5. fişini dolduran 12 misafire ikram tanımlandı',
    '[ETHOS] müşteri yanıtları üslup kontrolü: centilmen ✓',
  ],
  creative: [
    '[LİKYA-1] görev: yaz lansmanı → Creative filo',
    '[KALYPSO] slogan üretildi: "Tek kartla tüm Likya senin."',
    '[ARTE] görsel isteği: flux-pro · 4 varyant · 1080x1350 (feed)',
    '[ARTE] varyant 2 seçildi → marka paletine uyarlandı ✓',
    '[PROMETHEUS] 30 sn Reels senaryosu: 6 sahne · kurgu planı hazır',
    '[BABEL] lansman metni: EN ✓ · DE ✓ · RU ✓ · AR işleniyor…',
    '[BABEL] kültürel uyarlama: AR sürümünde deyim düzeltildi ✓',
  ],
  hr: [
    '[DAZE-CREW] vardiya planı yayınlandı: 14 personel · hafta 32',
    '[DAZE-CREW] saatlik kazanç panosu güncellendi · prim hesaplandı',
    '[SOCRATES] nezaket simülasyonu: "yoğun saatte gecikme özrü" senaryosu',
    '[SOCRATES] eğitim sonucu: saha ekibi centilmenlik puanı 9.2/10 ✓',
    '[DAZE-CREW] performans puanlaması: 3 personele teşekkür rozeti',
  ],
  finance: [
    '[PLUTUS] AI API harcama raporu: aylık bütçenin %61\u2019i · limit güvende',
    '[PLUTUS] sunucu gideri optimizasyonu: %14 tasarruf önerisi hazır',
    '[MINT] borsa algoritması: çay fiyatı yoğunlukla %5 esnetildi',
    '[MINT] mutfak borsası: 3 ürün indirime, 2 ürün prime geçti',
    '[DAZE-HUB] maliyet sapma analizi MINT ile senkronize ✓',
  ],
  rnd: [
    '[HERODOT] pazar taraması: 4 yeni geçiş teknolojisi patenti bulundu',
    '[HERODOT] rakip analizi: bölgesel pass sistemlerinde QR + NFC hibrit trendi',
    '[ODYSSEUS] DeepSeek-R1 testi: mantık görevlerinde %18 iyileşme',
    '[ODYSSEUS] Llama-3.3 kıyaslaması kuyruğa alındı…',
    '[HERODOT] yeni fikir: plaj giriş yoğunluğu tahmin modeli → CEO onayında',
  ],
};

function DepartmentStream({ department }: { department: DepartmentId }) {
  const lines = useMemo(() => STREAMS[department], [department]);
  const { rendered, current } = useTypewriter(lines, 16, 900);

  return (
    <div className="flex h-full min-h-64 flex-col overflow-hidden rounded-xl border border-obsidian-700 bg-black/60">
      <div className="flex items-center gap-2 border-b border-obsidian-700 bg-obsidian-900 px-4 py-2">
        <Terminal className="size-3.5 text-lykia-400" />
        <span className="font-mono text-[11px] text-slate-400">canlı departman akışı</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          CANLI
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-5">
        {rendered.map((line, i) => (
          <p key={i} className={line.startsWith('[') ? 'text-lykia-300' : 'text-emerald-200/90'}>
            {line || '\u00A0'}
          </p>
        ))}
        <p className={current.startsWith('[') ? 'text-lykia-300' : 'text-emerald-200/90'}>
          {current}
          <span className="cursor-blink ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-lykia-400" />
        </p>
      </div>
    </div>
  );
}

export default function AgentsPanel() {
  const [selected, setSelected] = useState<DepartmentId>('executive');
  const dept = DEPARTMENTS.find((d) => d.id === selected)!;
  const agents = agentsByDepartment(selected);
  const activeCount = AGENTS.filter((a) => a.state === 'aktif').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Bot className="size-6 text-lykia-400" />
            IT &amp; AI Ajanlar Paneli
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            LİKYA Holding otonom filosu: {AGENTS.length} uzman ajan · {DEPARTMENTS.length}{' '}
            stratejik departman · {activeCount} aktif
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-lykia-500/25 bg-lykia-500/10 px-3.5 py-1.5 text-xs font-semibold text-lykia-300">
          <ShieldCheck className="size-4" />
          Master Kural (ETHOS): {MASTER_RULE}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((d) => {
          const isActive = d.id === selected;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-lykia-500/50 bg-lykia-500/15 text-lykia-300'
                  : 'border-obsidian-700 bg-obsidian-900 text-slate-400 hover:border-slate-500/60 hover:text-slate-200'
              }`}
            >
              {d.shortName}
              <span className="ml-1.5 opacity-60">{agentsByDepartment(d.id).length}</span>
            </button>
          );
        })}
      </div>

      <PanelCard
        title={dept.name}
        subtitle={dept.description}
        actions={
          <span
            className={`rounded-full bg-obsidian-800 px-3 py-1 text-xs font-semibold ${dept.accent}`}
          >
            {dept.shortName} · {agents.length} ajan
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <ul className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 xl:col-span-3">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lykia-500/10 font-mono text-[10px] font-bold text-lykia-400">
                      {agent.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{agent.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{agent.role}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-medium capitalize ${STATE_STYLE[agent.state]}`}
                  >
                    <CircleDot className="size-3" />
                    {agent.state}
                  </span>
                </div>
                <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {agent.task}
                </p>
                <p className="mt-2 truncate font-mono text-[10px] text-slate-600">
                  motor: {agent.engine}
                </p>
              </li>
            ))}
          </ul>
          <div className="xl:col-span-2">
            <DepartmentStream key={selected} department={selected} />
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
