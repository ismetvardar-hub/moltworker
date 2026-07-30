import type { Agent, DepartmentId } from '../types';

export interface Department {
  id: DepartmentId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'core-it',
    name: 'Yazılım & Sistem Departmanı',
    shortName: 'Core IT',
    description: 'API, web, mobil ve güvenlik — ekosistemin teknik omurgası',
    accent: 'text-sky-300',
  },
  {
    id: 'creative',
    name: 'Medya & İçerik Üretim Departmanı',
    shortName: 'Creative & Social',
    description: 'Görsel, video, sosyal medya ve kreatif metin üretimi',
    accent: 'text-fuchsia-300',
  },
  {
    id: 'global-ops',
    name: 'Dil, Operasyon & Analiz Departmanı',
    shortName: 'Global & Ops',
    description: 'Lokalizasyon, orkestrasyon, bildirim ve veri analizi',
    accent: 'text-lykia-300',
  },
];

export const AGENTS: Agent[] = [
  // ── Yazılım & Sistem (Core IT) ──────────────────────────────
  {
    id: 'atlas',
    name: 'ATLAS',
    role: 'Backend & Mimari',
    engine: 'deepseek-coder',
    department: 'core-it',
    state: 'aktif',
    task: 'API, veritabanı, Ollama entegrasyonu ve sunucu güvenliği',
  },
  {
    id: 'phaselis',
    name: 'PHASELIS',
    role: 'Web App Geliştirici',
    engine: 'qwen2.5',
    department: 'core-it',
    state: 'aktif',
    task: 'CEO Paneli, OlymposPass Web portalı ve responsive arayüzler',
  },
  {
    id: 'olympos-mobile',
    name: 'OLYMPOS-MOBILE',
    role: 'Mobil Geliştirici',
    engine: 'deepseek-coder',
    department: 'core-it',
    state: 'beklemede',
    task: 'Flutter / React Native ile iOS ve Android uygulamaları',
  },
  {
    id: 'chimera',
    name: 'CHIMERA',
    role: 'Güvenlik & QA',
    engine: 'qwen2.5',
    department: 'core-it',
    state: 'aktif',
    task: 'Kod denetimi, auth testleri ve penetrasyon simülasyonu',
  },

  // ── Medya & İçerik (Creative & Social) ──────────────────────
  {
    id: 'arte',
    name: 'ARTE',
    role: 'Görsel & Tasarım Ajanı',
    engine: 'Midjourney / Flux / DALL-E',
    department: 'creative',
    state: 'aktif',
    task: 'Sosyal medya görselleri, UI bileşen tasarımları ve afişler',
  },
  {
    id: 'prometheus',
    name: 'PROMETHEUS',
    role: 'Video & Motion',
    engine: 'HeyGen / Runway / Sora',
    department: 'creative',
    state: 'beklemede',
    task: 'Otonom video içerikleri ve tanıtım videosu senaryolaştırma',
  },
  {
    id: 'hermes',
    name: 'HERMES',
    role: 'Sosyal Medya Manager',
    engine: 'qwen2.5',
    department: 'creative',
    state: 'aktif',
    task: 'Instagram, LinkedIn, X paylaşımları, trend takibi ve takvim',
  },
  {
    id: 'kalypso',
    name: 'KALYPSO',
    role: 'Kreatif Metin & Storyteller',
    engine: 'llama3',
    department: 'creative',
    state: 'aktif',
    task: 'Marka diliyle sloganlar, lansman metinleri ve blog yazıları',
  },

  // ── Dil, Operasyon & Analiz (Global & Ops) ──────────────────
  {
    id: 'babel',
    name: 'BABEL',
    role: 'Çoklu Dil & Lokalizasyon',
    engine: 'qwen2.5',
    department: 'global-ops',
    state: 'aktif',
    task: 'İçerikleri EN/DE/RU dillerine kültürel bağlamıyla çevirir',
  },
  {
    id: 'likya-1',
    name: 'LİKYA-1',
    role: 'CEO Başanalist & Orchestrator',
    engine: 'llama3',
    department: 'global-ops',
    state: 'aktif',
    task: 'CEO talimatlarını ilgili ajanlara böler, filoyu koordine eder',
  },
  {
    id: 'hermes-comm',
    name: 'HERMES-COMM',
    role: 'WhatsApp & Bildirim',
    engine: 'WhatsApp Business API',
    department: 'global-ops',
    state: 'aktif',
    task: 'Misafir hatırlatmaları, geçiş uyarıları ve müşteri diyalogları',
  },
  {
    id: 'minos',
    name: 'MINOS',
    role: 'Veri & Analiz',
    engine: 'qwen2.5',
    department: 'global-ops',
    state: 'beklemede',
    task: 'Sosyal medya etkileşimi ve OlymposPass istatistik raporları',
  },
];

export function agentsByDepartment(department: DepartmentId): Agent[] {
  return AGENTS.filter((a) => a.department === department);
}
