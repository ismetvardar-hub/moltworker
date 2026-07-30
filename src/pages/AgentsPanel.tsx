import { useMemo } from 'react';
import { Bot, CircleDot, Terminal } from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { useTypewriter } from '../hooks/useTypewriter';
import type { Agent, AgentState } from '../types';

const AGENTS: Agent[] = [
  {
    id: 'atlas',
    name: 'ATLAS',
    role: 'Backend Mimarı',
    model: 'deepseek-coder',
    state: 'aktif',
    task: 'OlymposPass doğrulama API uç noktalarını üretiyor',
  },
  {
    id: 'likya',
    name: 'LİKYA-1',
    role: 'Operasyon Analisti',
    model: 'qwen2.5',
    state: 'aktif',
    task: 'Geçiş loglarında anomali taraması yapıyor',
  },
  {
    id: 'phaselis',
    name: 'PHASELIS',
    role: 'Frontend Geliştirici',
    model: 'llama3',
    state: 'beklemede',
    task: 'CEO panel bileşenleri için görev bekliyor',
  },
  {
    id: 'chimera',
    name: 'CHIMERA',
    role: 'Güvenlik Denetçisi',
    model: 'deepseek-coder',
    state: 'aktif',
    task: 'Erişim yetki matrisini denetliyor',
  },
];

const STATE_STYLE: Record<AgentState, string> = {
  aktif: 'text-emerald-300',
  beklemede: 'text-amber-300',
  hata: 'text-rose-300',
};

const CODE_STREAM = [
  '[ATLAS] görev alındı: POST /api/pass/verify uç noktası',
  'import { Router } from "express";',
  'import { verifyPassCode } from "../services/passService";',
  '',
  'const router = Router();',
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
  '[ATLAS] birim testleri yazılıyor… 8/8 test geçti ✓',
  '[LİKYA-1] son 24 saatte 1.284 geçiş tarandı, 3 anomali işaretlendi',
  '[CHIMERA] yetki matrisi denetimi: kritik bulgu yok ✓',
  '[ATLAS] değişiklikler commit edildi: feat(pass): verify endpoint',
];

export default function AgentsPanel() {
  const lines = useMemo(() => CODE_STREAM, []);
  const { rendered, current } = useTypewriter(lines);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <Bot className="size-6 text-lykia-400" />
          IT &amp; AI Ajanlar Paneli
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Kod üretim akışı ve ajansal görevlerin canlı izleme ekranı.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <PanelCard
          title="Ajan Filosu"
          subtitle="Görevli otonom ajanlar ve modelleri"
          className="xl:col-span-2"
        >
          <ul className="space-y-3">
            {AGENTS.map((agent) => (
              <li
                key={agent.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-lykia-500/10 font-mono text-xs font-bold text-lykia-400">
                      {agent.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{agent.name}</p>
                      <p className="text-xs text-slate-500">{agent.role}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${STATE_STYLE[agent.state]}`}
                  >
                    <CircleDot className="size-3.5" />
                    {agent.state}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{agent.task}</p>
                <p className="mt-2 font-mono text-[11px] text-slate-600">model: {agent.model}</p>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          title="Canlı Kod Üretim Akışı"
          subtitle="Ajan çıktıları gerçek zamanlı daktilo akışıyla görüntülenir"
          className="xl:col-span-3"
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
              CANLI
            </span>
          }
        >
          <div className="flex h-105 flex-col overflow-hidden rounded-xl border border-obsidian-700 bg-black/60">
            <div className="flex items-center gap-2 border-b border-obsidian-700 bg-obsidian-900 px-4 py-2.5">
              <Terminal className="size-4 text-lykia-400" />
              <span className="font-mono text-xs text-slate-400">
                likya-agents — canlı görev akışı
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-6">
              {rendered.map((line, i) => (
                <p key={i} className={line.startsWith('[') ? 'text-lykia-300' : 'text-emerald-200/90'}>
                  {line || '\u00A0'}
                </p>
              ))}
              <p className={current.startsWith('[') ? 'text-lykia-300' : 'text-emerald-200/90'}>
                {current}
                <span className="cursor-blink ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-lykia-400" />
              </p>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
