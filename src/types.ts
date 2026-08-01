export type PageId =
  | 'hub'
  | 'komuta'
  | 'ollama'
  | 'ajanlar'
  | 'olympospass'
  | 'chef'
  | 'crew'
  | 'vision'
  | 'nexus'
  | 'jobs'
  | 'venues'
  | 'brands'
  | 'guests'
  | 'reports'
  | 'notifications'
  | 'ops'
  | 'metrics'
  | 'field'
  | 'inventory'
  | 'shifts'
  | 'reservations'
  | 'loyalty'
  | 'incidents'
  | 'suppliers'
  | 'feedback'
  | 'exports'
  | 'consent'
  | 'announcements'
  | 'recipes'
  | 'checklists'
  | 'lostfound'
  | 'tips'
  | 'audit'
  | 'maintenance'
  | 'brief'
  | 'menu'
  | 'campaigns'
  | 'i18n'
  | 'coldchain'
  | 'handover'
  | 'cash'
  | 'assets'
  | 'energy'
  | 'training'
  | 'readiness'
  | 'digest'
  | 'boardpack'
  | 'concierge'
  | 'minibar'
  | 'folio'
  | 'banquet'
  | 'tours'
  | 'marina'
  | 'hammam'
  | 'towels'
  | 'bands'
  | 'haccp'
  | 'patrol'
  | 'fleet'
  | 'payroll'
  | 'flash'
  | 'warroom'
  | 'upsell'
  | 'otareviews'
  | 'groups'
  | 'vipnotes'
  | 'photoshoot'
  | 'dive'
  | 'bikerent'
  | 'cinema'
  | 'retail'
  | 'bakery'
  | 'breakfast'
  | 'lateout'
  | 'amenities'
  | 'nightlog'
  | 'nightly'
  | 'mysteryshop'
  | 'partners'
  | 'shuttle'
  | 'lounge'
  | 'winecellar'
  | 'allergens'
  | 'sustain'
  | 'mediakit'
  | 'meetingrooms'
  | 'badgeprint'
  | 'transfers'
  | 'beachbeds'
  | 'kidsclub'
  | 'lockers'
  | 'emergency'
  | 'kds'
  | 'passstock'
  | 'contracts'
  | 'budget'
  | 'pulse'
  | 'content'
  | 'wifi'
  | 'laundry'
  | 'cleaning'
  | 'delivery'
  | 'giftcards'
  | 'eventcal'
  | 'spa'
  | 'weather'
  | 'hours'
  | 'kudos'
  | 'complaints'
  | 'waitlist'
  | 'seating'
  | 'waste'
  | 'vendorscore'
  | 'documents'
  | 'music'
  | 'valet'
  | 'docs'
  | 'webhooks'
  | 'settings';

export type SystemHealth = 'online' | 'degraded' | 'offline' | 'unknown';

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaStatus {
  reachable: boolean;
  version?: string;
  error?: string;
  checkedAt: Date;
}

export interface Directive {
  id: number;
  text: string;
  issuedAt: Date;
  status: 'kuyrukta' | 'isleniyor' | 'tamamlandi' | 'hata';
  /** Talimatı işleyen model; simülasyon modunda undefined. */
  model?: string;
  /** LİKYA-1'in bu talimat için yaptığı ajan görev dağılımı. */
  assignments?: Assignment[];
}

export type AgentState = 'aktif' | 'beklemede' | 'hata';

export type DepartmentId =
  | 'executive'
  | 'tech'
  | 'supply'
  | 'legal'
  | 'sales'
  | 'creative'
  | 'hr'
  | 'finance'
  | 'rnd';

export interface Agent {
  id: string;
  name: string;
  role: string;
  /** Ajanın kullandığı motor: yerel model veya harici API. */
  engine: string;
  department: DepartmentId;
  state: AgentState;
  task: string;
}

export interface Assignment {
  agentId: string;
  agentName: string;
  subtask: string;
}

export type PipelineStepStatus = 'bekliyor' | 'calisiyor' | 'tamamlandi' | 'hata';

/** HERODOT canlı web kaynağı (proxy /api/search sonucundan). */
export interface WebSource {
  title: string;
  url: string;
  snippet: string;
}

/** Zincirleme akışta tek bir ajan adımı; çıktı bir sonraki adıma girdi olur. */
export interface PipelineStep {
  assignment: Assignment;
  engine: string;
  status: PipelineStepStatus;
  output: string;
  /** HERODOT adımında canlı web kaynakları. */
  sources?: WebSource[];
  /** Arama sağlayıcısı (brave / tavily / duckduckgo / fallback-pool). */
  searchProvider?: string;
  searchLive?: boolean;
}

export type PassTier = 'Platin' | 'Altın' | 'Gümüş' | 'Standart';

export interface PassHolder {
  id: string;
  name: string;
  tier: PassTier;
  zones: string[];
  lastEntry: string;
  active: boolean;
}

export interface AccessEvent {
  id: number;
  holder: string;
  gate: string;
  time: string;
  allowed: boolean;
}
