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
  BarChart3,
  Bell,
  Building2,
  HardDrive,
  ListTodo,
  MapPin,
  Settings,
  ShieldCheck,
  TabletSmartphone,
  Ticket,
  UserRound,
  Users,
  Webhook,
  Package,
  CalendarClock,
  BookOpen,
  CalendarCheck,
  Gift,
  AlertTriangle,
  Truck,
  MessageSquareHeart,
  Download,
  Scale,
  Megaphone,
  UtensilsCrossed,
  ClipboardCheck,
  Search,
  Coins,
  ScrollText,
  Wrench,
  Sunrise,
} from 'lucide-react';
import type { AuthBrand } from '../services/auth';
import type { PageId } from '../types';

/** Marka süzgecinden muaf — her zaman göster (rol izinliyorsa) */
const ALWAYS_VISIBLE = new Set<PageId>([
  'hub',
  'brands',
  'guests',
  'notifications',
  'settings',
  'ops',
  'metrics',
  'reports',
  'webhooks',
  'docs',
  'incidents',
  'exports',
  'consent',
  'announcements',
  'audit',
  'brief',
]);

interface SidebarProps {
  active: PageId;
  allowedPages: string[];
  userName: string;
  userRole: string;
  brands?: AuthBrand[];
  activeBrandId?: string | null;
  onBrandChange?: (brandId: string) => void;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; description: string; icon: typeof Cpu }[] = [
  {
    id: 'komuta',
    label: 'LİKYA Komuta Merkezi',
    description: 'Sistem durumu & talimatlar',
    icon: LayoutDashboard,
  },
  {
    id: 'brief',
    label: 'Günlük Brief',
    description: 'Sabah operasyon özeti',
    icon: Sunrise,
  },
  {
    id: 'hub',
    label: 'Daze Hub',
    description: 'Merkezi operasyon özeti',
    icon: Network,
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
    label: 'OlymposPass Geçiş',
    description: 'Kart/QR · kapı · NEXUS',
    icon: Ticket,
  },
  {
    id: 'field',
    label: 'Saha Modu',
    description: 'Tablet · offline kuyruk',
    icon: TabletSmartphone,
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
  {
    id: 'jobs',
    label: 'Görev Kuyruğu',
    description: 'Hatırlatma & talimat zamanlama',
    icon: ListTodo,
  },
  {
    id: 'venues',
    label: 'Tesisler',
    description: 'Çoklu locasyon & kapılar',
    icon: MapPin,
  },
  {
    id: 'brands',
    label: 'Markalar',
    description: 'Kiracı / ürün kapsamı',
    icon: Building2,
  },
  {
    id: 'guests',
    label: 'Misafir CRM',
    description: 'Pass · WA · geçiş izi',
    icon: UserRound,
  },
  {
    id: 'reports',
    label: 'Rapor & ETHOS',
    description: 'Operasyon özeti & uyum skoru',
    icon: ShieldCheck,
  },
  {
    id: 'notifications',
    label: 'Bildirimler',
    description: 'Operasyon gelen kutusu',
    icon: Bell,
  },
  {
    id: 'ops',
    label: 'Sistem & Yedek',
    description: 'Health · backup · restore',
    icon: HardDrive,
  },
  {
    id: 'metrics',
    label: 'Gözlemlenebilirlik',
    description: 'Metrikler & hata panosu',
    icon: BarChart3,
  },
  {
    id: 'inventory',
    label: 'Envanter',
    description: 'HEPHAESTUS stok & hareket',
    icon: Package,
  },
  {
    id: 'shifts',
    label: 'Vardiyalar',
    description: 'Crew vardiya planı',
    icon: CalendarClock,
  },
  {
    id: 'reservations',
    label: 'Rezervasyonlar',
    description: 'Masa / tesis planı',
    icon: CalendarCheck,
  },
  {
    id: 'loyalty',
    label: 'Sadakat',
    description: 'AURA · Daze-Gift puan',
    icon: Gift,
  },
  {
    id: 'incidents',
    label: 'Olay Panosu',
    description: 'Stok · görev · geçiş',
    icon: AlertTriangle,
  },
  {
    id: 'suppliers',
    label: 'Tedarik',
    description: 'AGORA satınalma',
    icon: Truck,
  },
  {
    id: 'feedback',
    label: 'Geri Bildirim',
    description: 'NPS & yorumlar',
    icon: MessageSquareHeart,
  },
  {
    id: 'exports',
    label: 'Dışa Aktarım',
    description: 'CSV katalog',
    icon: Download,
  },
  {
    id: 'consent',
    label: 'KVKK Onay',
    description: 'VALKYRIE onay günlüğü',
    icon: Scale,
  },
  {
    id: 'announcements',
    label: 'Duyurular',
    description: 'Holding brifing',
    icon: Megaphone,
  },
  {
    id: 'recipes',
    label: 'Reçeteler',
    description: 'Mutfak · stok düşüm',
    icon: UtensilsCrossed,
  },
  {
    id: 'checklists',
    label: 'Kontrol Listeleri',
    description: 'Açılış / kapanış',
    icon: ClipboardCheck,
  },
  {
    id: 'lostfound',
    label: 'Kayıp Eşya',
    description: 'Buluntu defteri',
    icon: Search,
  },
  {
    id: 'tips',
    label: 'Bahşiş Havuzu',
    description: 'Crew tip pool',
    icon: Coins,
  },
  {
    id: 'maintenance',
    label: 'Bakım',
    description: 'Arıza / ticket kuyruğu',
    icon: Wrench,
  },
  {
    id: 'audit',
    label: 'Denetim',
    description: 'Audit günlüğü',
    icon: ScrollText,
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    description: 'Outbound olay POST',
    icon: Webhook,
  },
  {
    id: 'docs',
    label: 'API Docs',
    description: 'OpenAPI uç noktaları',
    icon: BookOpen,
  },
  {
    id: 'settings',
    label: 'Platform Ayarları',
    description: 'API anahtarları & köprüler',
    icon: Settings,
  },
];

export default function Sidebar({
  active,
  allowedPages,
  userName,
  userRole,
  brands = [],
  activeBrandId,
  onBrandChange,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const activeBrand = brands.find((b) => b.id === activeBrandId);
  const modules = new Set(activeBrand?.modules ?? []);

  const items = NAV_ITEMS.filter((item) => {
    if (!allowedPages.includes(item.id)) return false;
    if (!activeBrand || ALWAYS_VISIBLE.has(item.id)) return true;
    return modules.has(item.id);
  });

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

      {brands.length > 0 && (
        <div className="border-b border-obsidian-700 px-3 py-3">
          <label className="block">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Aktif marka
            </span>
            <select
              value={activeBrandId ?? ''}
              onChange={(e) => onBrandChange?.(e.target.value)}
              className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

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
