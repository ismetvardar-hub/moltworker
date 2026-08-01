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
  Utensils,
  BadgePercent,
  Languages,
  Thermometer,
  NotebookPen,
  Wallet,
  Boxes,
  Zap,
  Car,
  Music2,
  FileText,
  Star,
  Trash2,
  Armchair,
  ListOrdered,
  MessageCircleWarning,
  Award,
  Clock3,
  CloudSun,
  Gauge,
  Sparkles,
  CalendarDays,
  CreditCard,
  Bike,
  SprayCan,
  Shirt,
  Wifi,
  Images,
  Activity,
  Landmark,
  FileSignature,
  ScanBarcode,
  MonitorPlay,
  PhoneCall,
  Newspaper,
  GraduationCap,
  Lock,
  Baby,
  Palmtree,
  Plane,
  Printer,
  Presentation,
  Clapperboard,
  Leaf,
  ShieldAlert,
  Wine,
  Sofa,
  Bus,
  Hotel,
  Eye,
  BriefcaseBusiness,
  ConciergeBell,
  Receipt,
  PartyPopper,
  MapPinned,
  Anchor,
  Bath,
  Watch,
  ClipboardList,
  Shield,
  Banknote,
  Radar,
  TrendingUp,
  MessageSquareQuote,
  UsersRound,
  Crown,
  Camera,
  Waves,
  ShoppingBag,
  Croissant,
  Coffee,
  MoonStar,
  Telescope,
  KeyRound,
  DoorOpen,
  BedDouble,
  AlarmClock,
  PackageCheck,
  QrCode,
  Smartphone,
  Mic2,
  Palette,
  Flower2,
  GlassWater,
  TicketPercent,
  Orbit,
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
  'readiness',
  'digest',
  'boardpack',
  'warroom',
  'nightly',
  'orbit',
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
    id: 'menu',
    label: 'Menü',
    description: 'Fiyat & katalog',
    icon: Utensils,
  },
  {
    id: 'campaigns',
    label: 'Kampanyalar',
    description: 'Promo kodları',
    icon: BadgePercent,
  },
  {
    id: 'i18n',
    label: 'Lokalizasyon',
    description: 'BABEL çeviri notları',
    icon: Languages,
  },
  {
    id: 'coldchain',
    label: 'Soğuk Zincir',
    description: 'LOGOS sıcaklık log',
    icon: Thermometer,
  },
  {
    id: 'handover',
    label: 'Vardiya Teslim',
    description: 'Personel handover',
    icon: NotebookPen,
  },
  {
    id: 'cash',
    label: 'Kasa',
    description: 'Till hareketleri',
    icon: Wallet,
  },
  {
    id: 'assets',
    label: 'Varlıklar',
    description: 'Ekipman envanteri',
    icon: Boxes,
  },
  {
    id: 'energy',
    label: 'Enerji',
    description: 'Sayaç okumaları',
    icon: Zap,
  },
    { id: 'spa', label: 'Spa / Wellness', description: 'Spa randevu defteri.', icon: Sparkles },
  { id: 'eventcal', label: 'Etkinlikler', description: 'Tesis etkinlik takvimi.', icon: CalendarDays },
  { id: 'giftcards', label: 'Hediye Kartları', description: 'Daze-Gift bakiyeleri.', icon: CreditCard },
  { id: 'delivery', label: 'Paket Servis', description: 'Takeaway kuyruğu.', icon: Bike },
  { id: 'cleaning', label: 'Temizlik', description: 'Housekeeping görevleri.', icon: SprayCan },
  { id: 'laundry', label: 'Çamaşırhane', description: 'Tekstil partileri.', icon: Shirt },
  { id: 'wifi', label: 'WiFi Kupon', description: 'Misafir hotspot.', icon: Wifi },
  { id: 'content', label: 'İçerik Kuyruğu', description: 'Sosyal onay sırası.', icon: Images },
  { id: 'pulse', label: 'Ekip Nabız', description: 'Personel anketi.', icon: Activity },
  { id: 'budget', label: 'Bütçe', description: 'PLUTUS satırları.', icon: Landmark },
  { id: 'contracts', label: 'Sözleşmeler', description: 'Yenileme takibi.', icon: FileSignature },
  { id: 'passstock', label: 'Pass Stok', description: 'Kart/bileklik envanteri.', icon: ScanBarcode },
  { id: 'kds', label: 'KDS', description: 'Mutfak ekranı.', icon: MonitorPlay },
  { id: 'emergency', label: 'Acil Rehber', description: 'Acil iletişim.', icon: PhoneCall },
    { id: 'lockers', label: 'Dolap Kiralama', description: 'Spa/plaj dolapları.', icon: Lock },
  { id: 'kidsclub', label: 'Kids Club', description: 'Çocuk kulübü kayıt.', icon: Baby },
  { id: 'beachbeds', label: 'Şezlong', description: 'Sahil şezlong rezervasyonu.', icon: Palmtree },
  { id: 'transfers', label: 'Transfer Masası', description: 'Taksi / shuttle talepleri.', icon: Plane },
  { id: 'badgeprint', label: 'Kart Baskı', description: 'Pass yeniden baskı kuyruğu.', icon: Printer },
  { id: 'meetingrooms', label: 'Toplantı Odaları', description: 'Oda rezervasyonu.', icon: Presentation },
  { id: 'mediakit', label: 'Medya Kiti', description: 'Basın / içerik varlıkları.', icon: Clapperboard },
  { id: 'sustain', label: 'Sürdürülebilirlik', description: 'ESG metrik kayıtları.', icon: Leaf },
  { id: 'allergens', label: 'Alerjen Matrisi', description: 'Menü alerjen işaretleri.', icon: ShieldAlert },
  { id: 'winecellar', label: 'Şarap Mahzeni', description: 'Şarap stok/servis.', icon: Wine },
  { id: 'lounge', label: 'Lounge Log', description: 'Lounge ziyaret kaydı.', icon: Sofa },
  { id: 'shuttle', label: 'Shuttle Saatleri', description: 'Ring seferleri.', icon: Bus },
  { id: 'partners', label: 'Partner Oteller', description: 'B2B partner listesi.', icon: Hotel },
  { id: 'mysteryshop', label: 'Gizli Müşteri', description: 'Mystery shopper skorları.', icon: Eye },
  { id: 'concierge', label: 'Concierge', description: 'Misafir concierge talepleri.', icon: ConciergeBell },
  { id: 'minibar', label: 'Minibar', description: 'Oda minibar ikmal.', icon: Wine },
  { id: 'folio', label: 'Misafir Hesap', description: 'Folio charge post.', icon: Receipt },
  { id: 'banquet', label: 'Banket', description: 'Düğün / banket ops.', icon: PartyPopper },
  { id: 'tours', label: 'Tur Masası', description: 'Tur / gezi rezervasyonu.', icon: MapPinned },
  { id: 'marina', label: 'Marina', description: 'Tekne bağlama / slip.', icon: Anchor },
  { id: 'hammam', label: 'Hamam', description: 'Hamam randevu (spa dışı).', icon: Bath },
  { id: 'towels', label: 'Havlu Takibi', description: 'Plaj/havuz havlu stok.', icon: Shirt },
  { id: 'bands', label: 'Günlük Bileklik', description: 'Day-use bileklik dağıtım.', icon: Watch },
  { id: 'haccp', label: 'HACCP', description: 'Gıda güvenliği kayıtları.', icon: ClipboardList },
  { id: 'patrol', label: 'Güvenlik Turu', description: 'Gece/gündüz patrol log.', icon: Shield },
  { id: 'fleet', label: 'Araç Filosu', description: 'Transfer/vale araç durumu.', icon: Car },
  { id: 'payroll', label: 'Bordro Özeti', description: 'Haftalık bordro satırları.', icon: Banknote },
  { id: 'flash', label: 'Flash Rapor', description: 'Günlük doluluk / gelir satırı.', icon: Zap },
  { id: 'upsell', label: 'Upsell', description: 'Oda/deneyim yükseltme teklifleri.', icon: TrendingUp },
  { id: 'otareviews', label: 'OTA Yorumlar', description: 'Booking/Tripadvisor yanıt kuyruğu.', icon: MessageSquareQuote },
  { id: 'groups', label: 'Grup Rezervasyon', description: 'Grup / blok rezervasyon.', icon: UsersRound },
  { id: 'vipnotes', label: 'VIP Notları', description: 'VIP tercih / dikkat notları.', icon: Crown },
  { id: 'photoshoot', label: 'Fotoğraf Çekim', description: 'Profesyonel çekim randevuları.', icon: Camera },
  { id: 'dive', label: 'Dalış', description: 'Scuba / snorkeling aktivite.', icon: Waves },
  { id: 'bikerent', label: 'Bisiklet', description: 'Bisiklet kiralama.', icon: Bike },
  { id: 'cinema', label: 'Açık Hava Sinema', description: 'Sahil sinema seansları.', icon: Clapperboard },
  { id: 'retail', label: 'Butik', description: 'Butik / hediyelik satış.', icon: ShoppingBag },
  { id: 'bakery', label: 'Pastane', description: 'Pastane / özel sipariş.', icon: Croissant },
  { id: 'breakfast', label: 'Kahvaltı Slot', description: 'Kahvaltı rezervasyon slotları.', icon: Coffee },
  { id: 'lateout', label: 'Late Checkout', description: 'Geç çıkış talepleri.', icon: MoonStar },
  { id: 'amenities', label: 'Amenity', description: 'Oda amenity / ikram listesi.', icon: Gift },
  { id: 'nightlog', label: 'Gece Log', description: 'Night audit operasyon satırları.', icon: ClipboardCheck },
  { id: 'keycards', label: 'Oda Kartı', description: 'Kapı kartı programlama kuyruğu.', icon: KeyRound },
  { id: 'roomstatus', label: 'Oda Durumu', description: 'HK oda durum panosu.', icon: DoorOpen },
  { id: 'bedding', label: 'Yatak / Extra', description: 'Ekstra yatak / beşik talepleri.', icon: BedDouble },
  { id: 'wakeups', label: 'Wake-up', description: 'Uyandırma çağrıları.', icon: AlarmClock },
  { id: 'parcels', label: 'Kargo / Emanet', description: 'Misafir kargo ve emanet.', icon: PackageCheck },
  { id: 'qrcheckin', label: 'QR Check-in', description: 'Mobil QR check-in oturumları.', icon: QrCode },
  { id: 'guestapp', label: 'Misafir App', description: 'Push / in-app bildirim kuyruğu.', icon: Smartphone },
  { id: 'karaoke', label: 'Karaoke', description: 'Eğlence / karaoke rezervasyon.', icon: Mic2 },
  { id: 'artwall', label: 'Sanat Duvarı', description: 'Galeri / sanat eser envanteri.', icon: Palette },
  { id: 'florals', label: 'Çiçek', description: 'Oda / etkinlik çiçek siparişi.', icon: Flower2 },
  { id: 'privatechef', label: 'Özel Şef', description: 'Private chef deneyimleri.', icon: ChefHat },
  { id: 'mocktails', label: 'Mocktail Bar', description: 'Alkolsüz imza içecekler.', icon: GlassWater },
  { id: 'promos', label: 'Promo Kod', description: 'Promosyon kod envanteri.', icon: TicketPercent },
  { id: 'dawnservice', label: 'Şafak Servisi', description: 'Erken kahve / gazete turu.', icon: Sunrise },
  { id: 'orbit', label: 'Orbit', description: 'AŞAMA 135 günlük yörünge.', icon: Orbit },
  { id: 'nightly', label: 'Night Audit', description: 'AŞAMA 120 gece kapanış.', icon: Telescope },
  { id: 'warroom', label: 'War Room', description: 'AŞAMA 105 komuta özeti.', icon: Radar },
  { id: 'boardpack', label: 'Board Pack', description: 'AŞAMA 90 yönetim paketi.', icon: BriefcaseBusiness },
  { id: 'digest', label: 'CEO Digest', description: 'AŞAMA 75 yönetici özeti.', icon: Newspaper },
  { id: 'readiness', label: 'Hazırlık Skoru', description: 'AŞAMA 60 panosu', icon: Gauge },
  { id: 'weather', label: 'Hava Brifi', description: 'Sahil operasyon', icon: CloudSun },
  { id: 'valet', label: 'Vale', description: 'Otopark fişleri', icon: Car },
  { id: 'music', label: 'Müzik', description: 'Playlist istekleri', icon: Music2 },
  { id: 'documents', label: 'Belgeler', description: 'Prosedür kasası', icon: FileText },
  { id: 'vendorscore', label: 'Tedarik Skor', description: 'Vendor scorecard', icon: Star },
  { id: 'waste', label: 'Fire', description: 'Atık günlüğü', icon: Trash2 },
  { id: 'seating', label: 'Oturma', description: 'Masa durumu', icon: Armchair },
  { id: 'waitlist', label: 'Bekleme', description: 'Misafir sırası', icon: ListOrdered },
  { id: 'complaints', label: 'Şikayetler', description: 'Escalation', icon: MessageCircleWarning },
  { id: 'kudos', label: 'Takdir', description: 'Kudos panosu', icon: Award },
  { id: 'hours', label: 'Saatler', description: 'Açılış/kapanış', icon: Clock3 },
  {
    id: 'training',
    label: 'Eğitim',
    description: 'SOCRATES quiz',
    icon: GraduationCap,
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
