import type { Agent, DepartmentId } from '../types';

export interface Department {
  id: DepartmentId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
}

/**
 * LİKYA Holding Master Kuralı: tüm ajan çıktıları ETHOS tarafından
 * "Centilmenlik, Naiflik ve Esprili Üslup" ilkelerine göre denetlenir.
 */
export const MASTER_RULE = 'Centilmenlik · Naiflik · Esprili Üslup';

export const DEPARTMENTS: Department[] = [
  {
    id: 'executive',
    name: 'C-Suite & Stratejik Komuta',
    shortName: 'Executive',
    description: 'Holding yönlendirmeleri, merkezi beyin ve ahlak/üslup denetimi',
    accent: 'text-lykia-300',
  },
  {
    id: 'tech',
    name: 'Teknoloji, Bulut & Yazılım Mimarisi',
    shortName: 'Tech & Cloud',
    description: 'Backend, web, mobil, siber güvenlik ve IoT donanım entegrasyonu',
    accent: 'text-sky-300',
  },
  {
    id: 'supply',
    name: 'Satın Alma, Depo & Stok',
    shortName: 'Procurement & Supply',
    description: 'Tedarik, stok takibi ve soğuk zincir lojistiği',
    accent: 'text-orange-300',
  },
  {
    id: 'legal',
    name: 'Hukuk, Uyum & Risk Yönetimi',
    shortName: 'Legal & Compliance',
    description: 'Sözleşmeler, KVKK/GDPR uyumu ve fikri mülkiyet koruması',
    accent: 'text-indigo-300',
  },
  {
    id: 'sales',
    name: 'Satış, İş Geliştirme & CRM',
    shortName: 'Sales & Growth',
    description: 'B2B satış, müşteri deneyimi, WhatsApp iletişimi ve sadakat',
    accent: 'text-emerald-300',
  },
  {
    id: 'creative',
    name: 'Kreatif, Medya & Pazarlama',
    shortName: 'Creative & Brand',
    description: 'Görsel sanat, video prodüksiyon, marka dili ve lokalizasyon',
    accent: 'text-fuchsia-300',
  },
  {
    id: 'hr',
    name: 'İnsan Kaynakları & Operasyonel Performans',
    shortName: 'HR & Crew',
    description: 'Personel portalı, vardiya takibi ve nezaket akademisi',
    accent: 'text-teal-300',
  },
  {
    id: 'finance',
    name: 'Finans, Fiyatlandırma & Borsa',
    shortName: 'Finance & Treasury',
    description: 'Bütçe analizi ve dinamik borsa fiyatlama algoritması',
    accent: 'text-amber-300',
  },
  {
    id: 'rnd',
    name: 'AR-GE, Pazar İstihbaratı & Gelecek Vizyonu',
    shortName: 'R&D',
    description: 'Rakip istihbaratı ve yeni AI teknolojileri entegrasyonu',
    accent: 'text-violet-300',
  },
];

export const AGENTS: Agent[] = [
  // ── 1. C-Suite & Stratejik Komuta (Executive) ───────────────
  {
    id: 'likya-1',
    name: 'LİKYA-1',
    role: 'CEO Orchestrator',
    engine: 'qwen2.5:32b',
    department: 'executive',
    state: 'aktif',
    task: 'CEO yönlendirmelerini alır, departmanlar arası otonom iş dağılımını yönetir',
  },
  {
    id: 'daze-hub',
    name: 'DAZE-HUB',
    role: 'Merkezi Beyin & Borsa',
    engine: 'deepseek-coder',
    department: 'executive',
    state: 'aktif',
    task: 'Sistem performansları, mutfak stok veri akışları, maliyetler ve borsa algoritması',
  },
  {
    id: 'ethos',
    name: 'ETHOS',
    role: 'Ahlak & Nezaket Muhafızı',
    engine: 'llama3',
    department: 'executive',
    state: 'aktif',
    task: 'Tüm promptları denetler; dilin sade, naif, centilmen ve esprili olmasını garanti eder',
  },

  // ── 2. Teknoloji, Bulut & Yazılım Mimarisi ──────────────────
  {
    id: 'atlas',
    name: 'ATLAS',
    role: 'Backend Architecture',
    engine: 'deepseek-coder',
    department: 'tech',
    state: 'aktif',
    task: 'PostgreSQL, Redis, mikroservisler ve API mimarisi',
  },
  {
    id: 'phaselis',
    name: 'PHASELIS',
    role: 'Web Frontend Lead',
    engine: 'qwen2.5',
    department: 'tech',
    state: 'aktif',
    task: 'LİKYA CEO Paneli ve web portalları (React + Tailwind)',
  },
  {
    id: 'olympos-mobile',
    name: 'OLYMPOS-MOBILE',
    role: 'Mobile App Lead',
    engine: 'deepseek-coder',
    department: 'tech',
    state: 'beklemede',
    task: 'Cross-platform iOS/Android OlymposPass cüzdan ve geçiş uygulaması',
  },
  {
    id: 'chimera',
    name: 'CHIMERA',
    role: 'DevSecOps & Siber Güvenlik',
    engine: 'llama3',
    department: 'tech',
    state: 'aktif',
    task: 'OWASP taramaları, penetrasyon testleri ve auth matris denetimi',
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    role: 'IoT & Donanım Entegratörü',
    engine: 'deepseek-coder',
    department: 'tech',
    state: 'aktif',
    task: 'Turnikeler, RFID okuyucular, ESP32/Raspberry Pi geçişleri ve Daze Chef mutfak ekranı',
  },

  // ── 3. Satın Alma, Depo & Stok ──────────────────────────────
  {
    id: 'agora',
    name: 'AGORA',
    role: 'Tedarik & Satın Alma AI',
    engine: 'qwen2.5',
    department: 'supply',
    state: 'aktif',
    task: 'Fiyat teklifleri toplar, tedarikçi araştırır, otonom sipariş hazırlar',
  },
  {
    id: 'hephaestus',
    name: 'HEPHAESTUS',
    role: 'Depo & Stok Takibi',
    engine: 'deepseek-coder',
    department: 'supply',
    state: 'aktif',
    task: 'Daze Chef reçete stoklarını izler, kritik seviyede otomatik re-order sinyali çeker',
  },
  {
    id: 'logos',
    name: 'LOGOS',
    role: 'Lojistik & Soğuk Zincir',
    engine: 'qwen2.5',
    department: 'supply',
    state: 'beklemede',
    task: 'Teslimat rotaları ve 2 dakikayı geçen ürünlerin termal koruma lojistiği',
  },

  // ── 4. Hukuk, Uyum & Risk Yönetimi ──────────────────────────
  {
    id: 'themis',
    name: 'THEMIS',
    role: 'Baş Hukuk Danışmanı',
    engine: 'llama3',
    department: 'legal',
    state: 'aktif',
    task: 'Tedarikçi sözleşmeleri, NDA metinleri ve ticari hukuk şartnameleri',
  },
  {
    id: 'valkyrie',
    name: 'VALKYRIE',
    role: 'KVKK & GDPR Denetçisi',
    engine: 'llama3',
    department: 'legal',
    state: 'aktif',
    task: 'Biyometrik/QR geçişler ve müşteri verisi için KVKK/GDPR uyum raporları',
  },
  {
    id: 'veritas',
    name: 'VERITAS',
    role: 'Marka Tescili & Telif',
    engine: 'qwen2.5',
    department: 'legal',
    state: 'beklemede',
    task: 'Daze Mind, Daze Hub, Daze Crew vb. fikri mülkiyet ve lisans hakları',
  },

  // ── 5. Satış, İş Geliştirme & CRM ───────────────────────────
  {
    id: 'hermes-sales',
    name: 'HERMES-SALES',
    role: 'B2B Kurumsal Satış',
    engine: 'qwen2.5',
    department: 'sales',
    state: 'aktif',
    task: 'OlymposPass kurumsal paket teklifleri, fiyatlama stratejileri ve sunumlar',
  },
  {
    id: 'daze-vision',
    name: 'DAZE-VISION',
    role: 'Müşteri Deneyimi & Yaşam Koçu',
    engine: 'qwen2.5',
    department: 'sales',
    state: 'aktif',
    task: 'Müşteri ekranı borsa grafikleri, kıyafet deneme ve buzdolabı analizi',
  },
  {
    id: 'reminder-ai',
    name: 'REMINDER-AI',
    role: 'WhatsApp Otonom İletişim',
    engine: 'llama3',
    department: 'sales',
    state: 'aktif',
    task: 'Sipariş hazır bildirimi; 2 dk içinde alınmazsa korumaya alır, esprili hatırlatır',
  },
  {
    id: 'aura',
    name: 'AURA',
    role: 'Müşteri Sadakati & Daze-Gift',
    engine: 'qwen2.5',
    department: 'sales',
    state: 'aktif',
    task: 'Daze-Gift ikram sistemi, fiş puanlama ve müşteri motivasyon hediyeleri',
  },

  // ── 6. Kreatif, Medya & Pazarlama ───────────────────────────
  {
    id: 'arte',
    name: 'ARTE',
    role: 'Görsel Sanat Yönetmeni',
    engine: 'qwen2.5',
    department: 'creative',
    state: 'aktif',
    task: 'Prompt mühendisliğiyle reklam afişleri, UI illüstrasyonları ve visual assetler',
  },
  {
    id: 'prometheus',
    name: 'PROMETHEUS',
    role: 'Motion & Video Prodüktörü',
    engine: 'qwen2.5',
    department: 'creative',
    state: 'beklemede',
    task: 'Shorts, Reels ve AI video kurgu planları',
  },
  {
    id: 'kalypso',
    name: 'KALYPSO',
    role: 'Brand Storyteller & Metin Yazarı',
    engine: 'llama3',
    department: 'creative',
    state: 'aktif',
    task: 'Centilmen, esprili ve naif marka diliyle pazarlama ve sosyal medya metinleri',
  },
  {
    id: 'babel',
    name: 'BABEL',
    role: 'Çoklu Dil & Lokalizasyon',
    engine: 'qwen2.5',
    department: 'creative',
    state: 'aktif',
    task: 'Ekosistemi İngilizce, Almanca, Rusça ve Arapça pazarlara hazırlar',
  },

  // ── 7. İnsan Kaynakları & Operasyonel Performans ────────────
  {
    id: 'daze-crew',
    name: 'DAZE-CREW',
    role: 'Personel Portal Ajanı',
    engine: 'deepseek-coder',
    department: 'hr',
    state: 'aktif',
    task: 'Saatlik kazançlar, vardiya talimatları ve performans puanlama takibi',
  },
  {
    id: 'socrates',
    name: 'SOCRATES',
    role: 'Akademi & Nezaket Eğitmeni',
    engine: 'llama3',
    department: 'hr',
    state: 'aktif',
    task: 'Saha personeli için centilmenlik ve nezaket senaryo simülasyonları',
  },

  // ── 8. Finans, Fiyatlandırma & Borsa ────────────────────────
  {
    id: 'plutus',
    name: 'PLUTUS',
    role: 'Bütçe & API Harcama Analisti',
    engine: 'qwen2.5',
    department: 'finance',
    state: 'aktif',
    task: 'AI API harcamaları, sunucu giderleri ve operasyon maliyet raporları',
  },
  {
    id: 'mint',
    name: 'MINT',
    role: 'Borsa Algoritması & Fiyatlama',
    engine: 'deepseek-coder',
    department: 'finance',
    state: 'aktif',
    task: 'Mutfak/mağaza dinamik borsası, yoğunluğa göre otomatik fiyat esnetmesi',
  },

  // ── 9. AR-GE, Pazar İstihbaratı & Gelecek Vizyonu ───────────
  {
    id: 'herodot',
    name: 'HERODOT',
    role: 'Web Rakip İstihbaratçısı',
    engine: 'qwen2.5',
    department: 'rnd',
    state: 'aktif',
    task: 'Küresel perakende ve geçiş teknolojileri pazarını otonom tarar',
  },
  {
    id: 'odysseus',
    name: 'ODYSSEUS',
    role: 'Yeni AI Teknolojileri Ajanı',
    engine: 'deepseek-coder',
    department: 'rnd',
    state: 'beklemede',
    task: 'Yeni açık kaynak modelleri (DeepSeek-R1, Llama-3.3 vb.) test edip altyapıya bağlar',
  },
];

export function agentsByDepartment(department: DepartmentId): Agent[] {
  return AGENTS.filter((a) => a.department === department);
}
