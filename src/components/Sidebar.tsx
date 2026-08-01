import {
  Bot,
  ChefHat,
  Cpu,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Mountain,
  Network,
  Radio,
  Ticket,
  Users,
} from 'lucide-react';
import type { PageId } from '../types';

interface SidebarProps {
  active: PageId;
  allowedPages: string[];
  userName: string;
  userRole: string;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; description: string; icon: typeof Cpu }[] = [
  {
    id: 'hub',
    label: 'Daze Hub',
    description: 'Merkezi operasyon özeti',
    icon: Network,
  },
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
  {
    id: 'nexus',
    label: 'NEXUS IoT',
    description: 'Turnike · kapı · RFID',
    icon: Radio,
  },
];

export default function Sidebar({
  active,
  allowedPages,
  userName,
  userRole,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const items = NAV_ITEMS.filter((item) => allowedPages.includes(item.id));

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
        {items.map(({ id, label, description, icon: Icon }) => {
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
        <div className="mb-3 rounded-xl border border-obsidian-700 bg-obsidian-950/50 px-3 py-3">
          <p className="text-sm font-semibold text-slate-100">{userName}</p>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-lykia-400/80">
            {userRole}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-obsidian-700 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300"
        >
          <LogOut className="size-4" />
          Çıkış Yap
        </button>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Centilmenlik · Naiflik · Esprili Üslup
          <br />
          Antalya / Likya bölgesi operasyon merkezi
        </p>
      </div>
    </aside>
  );
}
