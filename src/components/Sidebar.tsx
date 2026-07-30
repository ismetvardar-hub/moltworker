import {
  Bot,
  ChefHat,
  Cpu,
  HeartHandshake,
  LayoutDashboard,
  Mountain,
  Ticket,
  Users,
} from 'lucide-react';
import type { PageId } from '../types';

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string; description: string; icon: typeof Cpu }[] = [
  {
    id: 'komuta',
    label: 'LİKYA Komuta Merkezi',
    description: 'Sistem durumu & talimatlar',
    icon: LayoutDashboard,
  },
  {
    id: 'ollama',
    label: 'Yerel AI (Ollama)',
    description: 'Model servisi & durum',
    icon: Cpu,
  },
  {
    id: 'ajanlar',
    label: 'IT & AI Ajanlar',
    description: '28 ajan · 9 departman',
    icon: Bot,
  },
  {
    id: 'olympospass',
    label: 'OlymposPass Yönetimi',
    description: 'Geçişler & doğrulama',
    icon: Ticket,
  },
  {
    id: 'chef',
    label: 'Daze Chef',
    description: 'Mutfak paneli & 2 dk kuralı',
    icon: ChefHat,
  },
  {
    id: 'crew',
    label: 'Daze Crew',
    description: 'Personel portalı & kazanç',
    icon: Users,
  },
  {
    id: 'vision',
    label: 'Daze Vision',
    description: 'Müşteri portalı & borsa',
    icon: HeartHandshake,
  },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-obsidian-700 bg-obsidian-900">
      <div className="flex items-center gap-3 border-b border-obsidian-700 px-5 py-5">
        <div className="glow-pulse flex size-11 items-center justify-center rounded-xl bg-lykia-500/15 text-lykia-400">
          <Mountain className="size-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-lykia-300">OLYMPOSPASS</h1>
          <p className="text-xs text-slate-400">LİKYA CEO Paneli</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ id, label, description, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-lykia-500/15 text-lykia-300'
                  : 'text-slate-300 hover:bg-obsidian-800 hover:text-slate-100'
              }`}
            >
              <Icon
                className={`size-5 shrink-0 ${isActive ? 'text-lykia-400' : 'text-slate-500 group-hover:text-slate-300'}`}
              />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-slate-500">{description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-obsidian-700 p-4">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Otonom ekosistem sürümü <span className="text-lykia-400">v1.0</span>
          <br />
          Antalya / Likya bölgesi operasyon merkezi
        </p>
      </div>
    </aside>
  );
}
