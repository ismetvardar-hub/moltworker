import { useMemo } from 'react';
import { Bot, CircleDot, Terminal } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { DEPARTMENTS, agentsByDepartment } from '../data/agents';
import { useTypewriter } from '../hooks/useTypewriter';
import type { AgentState, DepartmentId } from '../types';

const STATE_STYLE: Record<AgentState, string> = {
  aktif: 'text-emerald-300',
  beklemede: 'text-amber-300',
  hata: 'text-rose-300',
};

const STREAMS: Record<DepartmentId, string[]> = {
  'core-it': [
    '[LİKYA-1] görev: POST /api/pass/verify uç noktası → ATLAS',
    'import { Router } from "express";',
    'import { verifyPassCode } from "../services/passService";',
    '',
    'router.post("/api/pass/verify", async (req, res) => {',
    '  const { code, gateId } = req.body;',
    '  const result = await verifyPassCode(code, gateId);',
    '  if (!result.valid) {',
    '    return res.status(403).json({ error: "Geçersiz OlymposPass kodu" });',
    '  }',
    '  return res.json({ holder: result.holder, tier: result.tier });',
    '});',
    '',
    '[ATLAS] birim testleri: 8/8 geçti ✓',
    '[PHASELIS] CEO panel bileşeni güncellendi: <PassVerifyCard />',
    '[OLYMPOS-MOBILE] Flutter modülü: qr_scanner v2 entegre edildi',
    '[CHIMERA] auth denetimi: kritik bulgu yok ✓',
  ],
  creative: [
    '[LİKYA-1] görev: OlymposPass yaz sezonu lansmanı → Creative filo',
    '[KALYPSO] slogan üretildi: "Tek kartla tüm Likya senin."',
    '[KALYPSO] lansman metni taslağı hazır (382 kelime)',
    '[ARTE] görsel isteği: flux-pro · 4 varyant · 1080x1350 (feed)',
    '[ARTE] varyant 2 seçildi → marka renk paletine uyarlandı ✓',
    '[PROMETHEUS] 30 sn tanıtım senaryosu: sahne akışı 6 kare',
    '[PROMETHEUS] HeyGen avatar çekimi kuyruğa alındı…',
    '[HERMES] Instagram + LinkedIn paylaşım taslağı yazıldı',
    '[HERMES] en iyi paylaşım saati analizi: Salı 19:30 ✓',
    '[HERMES] paylaşım takvimine eklendi: 3 Ağustos 19:30',
  ],
  'global-ops': [
    '[LİKYA-1] talimat bölündü: metin → KALYPSO, çeviri → BABEL, görsel → ARTE',
    '[BABEL] lansman metni çevriliyor: EN ✓ · DE ✓ · RU işleniyor…',
    '[BABEL] kültürel uyarlama: RU sürümünde deyim düzeltildi ✓',
    '[HERMES-COMM] Olympos-Reminder: yarın 09:00, 42 misafire hatırlatma',
    '[HERMES-COMM] geçiş uyarısı: VIP kapı yoğunluğu %78 → bildirim gönderildi',
    '[MINOS] günlük rapor: 1.284 geçiş · %12 artış · 3 anomali',
    '[MINOS] sosyal medya etkileşimi: IG +%23, LinkedIn +%9',
    '[LİKYA-1] filo durumu: 9 aktif · 3 beklemede · 0 hata ✓',
  ],
};

function DepartmentStream({ department }: { department: DepartmentId }) {
  const lines = useMemo(() => STREAMS[department], [department]);
  const { rendered, current } = useTypewriter(lines, 16, 900);

  return (
    <div className="flex h-64 flex-col overflow-hidden rounded-xl border border-obsidian-700 bg-black/60">
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <Bot className="size-6 text-lykia-400" />
          IT &amp; AI Ajanlar Paneli
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          12 ajanlık departman bazlı otonom filo — canlı görev ve üretim akışları.
        </p>
      </div>

      {DEPARTMENTS.map((dept) => {
        const agents = agentsByDepartment(dept.id);
        return (
          <PanelCard
            key={dept.id}
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
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-3">
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
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {agent.name}
                          </p>
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
                <DepartmentStream department={dept.id} />
              </div>
            </div>
          </PanelCard>
        );
      })}
    </div>
  );
}
