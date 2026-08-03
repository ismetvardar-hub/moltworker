/**
 * LİKYA Kampüs — CEO menü domain haritası (Adım 2).
 * Rol bazlı çekirdek + domain; ince CRUD’lar Lab’da kalır.
 */

export type CampusDomain = {
  id: string
  label: string
  description: string
  /** Ana sayfa (açılırken gidilir) */
  primary: string
  /** Domain altında gösterilecek sayfa id’leri */
  pages: string[]
}

/** CEO üst şerit */
export const CORE_NAV_IDS = [
  'komuta',
  'campusbrief',
  'campus',
  'brief',
  'hub',
  'extremepark',
  'olympospass',
  'ajanlar',
  'ollama',
  'jobs',
  'crudops',
  'notifications',
  'ops',
  'settings',
] as const

export const CORE_NAV_KITCHEN = [
  'hub',
  'brief',
  'chef',
  'kds',
  'recipes',
  'menu',
  'inventory',
  'jobs',
  'notifications',
] as const

export const CORE_NAV_CREW = [
  'hub',
  'brief',
  'crew',
  'olympospass',
  'vision',
  'shifts',
  'field',
  'notifications',
] as const

/** 10 kampüs domain — CEO holding */
export const CAMPUS_DOMAINS: CampusDomain[] = [
  {
    id: 'sport',
    label: 'Spor & Extreme',
    description: 'Slot · waiver · arenalar · lisans kulüp',
    primary: 'extremepark',
    pages: [
      'extremepark',
      'sportbridge',
      'athleteos',
      'sportslot',
      'arenabook',
      'nexusgate',
      'rentgear',
      'tourpack',
    ],
  },
  {
    id: 'stay',
    label: 'Konaklama',
    description: 'Glamping · karavan · bungalow',
    primary: 'stayring',
    pages: ['stayring', 'staybook', 'dazeroom', 'keylessdoor', 'atlas', 'linen', 'roomrack', 'folio'],
  },
  {
    id: 'market',
    label: 'Pazaryeri',
    description: 'Al · kirala · 2. el',
    primary: 'marketos',
    pages: ['marketos', 'empire', 'tybridge', 'dolaplist', 'hephapick', 'rentgear', 'bazaar'],
  },
  {
    id: 'mall',
    label: 'Açık AVM & F&B',
    description: 'Kiracı · restoran · asgari harcama',
    primary: 'openmall',
    pages: ['openmall', 'hearth', 'bazaar', 'retailfloor', 'poslane', 'packfolio', 'chef', 'kds'],
  },
  {
    id: 'athlete',
    label: 'Kulüp & Sporcu',
    description: 'Gelişim · antrenman · yaşam uzmanı',
    primary: 'athleteos',
    pages: [
      'athleteos',
      'lifecoach',
      'sanctum',
      'biomarker',
      'sleepcoach',
      'nutrition',
      'forge',
      'traininghub',
    ],
  },
  {
    id: 'family',
    label: 'Aile & Çocuk',
    description: 'Kamp · yaz okulu · güvenli emanet',
    primary: 'familycamp',
    pages: ['familycamp', 'serenity', 'calmroom', 'welcomeamen', 'guestrequest', 'kidsclub'],
  },
  {
    id: 'culture',
    label: 'Kültür & Sahne',
    description: 'Müzik · sanat · tiyatro · medya',
    primary: 'culturescene',
    pages: ['culturescene', 'studio', 'aurora', 'livecast', 'mediawall', 'music', 'vision'],
  },
  {
    id: 'green',
    label: 'Yeşil & Arazi',
    description: 'ESG · orman · su · enerji · zonlar',
    primary: 'greenpulse',
    pages: ['greenpulse', 'campuscore', 'verdant', 'reefwatch', 'solaryield', 'wateruse', 'weather'],
  },
  {
    id: 'agents',
    label: 'Ajan Komuta',
    description: 'NEXUS · HEPHAESTUS · REMINDER · MINT · DAZE',
    primary: 'agentbridge',
    pages: [
      'campusbrief',
      'agentfleet',
      'agentbridge',
      'agentqueue',
      'komuta',
      'ajanlar',
      'ollama',
      'cognisphere',
      'vanguard',
      'oracle',
      'warroom',
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    description: 'Ops · yedek · audit · docs',
    primary: 'ops',
    pages: ['ops', 'jobs', 'crudops', 'brands', 'audit', 'metrics', 'docs', 'settings', 'readiness'],
  },
]

/** Mutfak operatör — boş kampüs hub’ları yok */
export const KITCHEN_DOMAINS: CampusDomain[] = [
  {
    id: 'kitchen',
    label: 'Mutfak',
    description: 'Chef · KDS · reçete · soğuk zincir',
    primary: 'chef',
    pages: ['chef', 'kds', 'recipes', 'menu', 'coldchain', 'waste', 'nexus', 'allergens', 'winecellar'],
  },
  {
    id: 'supply',
    label: 'Stok & Tedarik',
    description: 'Envanter · tedarikçi · bakım',
    primary: 'inventory',
    pages: ['inventory', 'suppliers', 'maintenance', 'assets', 'delivery', 'laundry', 'cleaning'],
  },
  {
    id: 'service',
    label: 'Servis',
    description: 'Brief · oturma · bekleyen · şikayet',
    primary: 'brief',
    pages: ['brief', 'seating', 'waitlist', 'complaints', 'handover', 'kudos', 'pulse'],
  },
  {
    id: 'kitchen-system',
    label: 'Sistem',
    description: 'İşler · docs · hazırlık',
    primary: 'jobs',
    pages: ['jobs', 'docs', 'readiness', 'weather', 'emergency', 'notifications'],
  },
]

/** Saha ekibi — OlymposPass / Daze crew */
export const CREW_DOMAINS: CampusDomain[] = [
  {
    id: 'floor',
    label: 'Saha',
    description: 'Crew · field · checklist · handover',
    primary: 'crew',
    pages: ['crew', 'field', 'checklists', 'handover', 'guests', 'reservations', 'waitlist', 'seating'],
  },
  {
    id: 'guest',
    label: 'Misafir',
    description: 'Pass · loyalty · concierge yüzeyleri',
    primary: 'olympospass',
    pages: ['olympospass', 'loyalty', 'lostfound', 'announcements', 'tips', 'spa', 'valet'],
  },
  {
    id: 'media',
    label: 'Medya & Ritim',
    description: 'Vision · içerik · müzik',
    primary: 'vision',
    pages: ['vision', 'content', 'music', 'pulse', 'campaigns', 'eventcal'],
  },
  {
    id: 'crew-system',
    label: 'Vardiya',
    description: 'Shifts · brief · hazırlık',
    primary: 'shifts',
    pages: ['shifts', 'brief', 'readiness', 'weather', 'training', 'notifications', 'digest'],
  },
]

export function coreNavForRole(role?: string | null): readonly string[] {
  if (role === 'kitchen') return CORE_NAV_KITCHEN
  if (role === 'crew') return CORE_NAV_CREW
  return CORE_NAV_IDS
}

export function domainsForRole(role?: string | null): CampusDomain[] {
  if (role === 'kitchen') return KITCHEN_DOMAINS
  if (role === 'crew') return CREW_DOMAINS
  return CAMPUS_DOMAINS
}

/** Lab’dan çıkarılacak — çekirdek + domain’de zaten görünenler */
export function surfacedNavIds(role?: string | null): Set<string> {
  const ids = new Set<string>(coreNavForRole(role))
  for (const d of domainsForRole(role)) {
    ids.add(d.primary)
    for (const p of d.pages) ids.add(p)
  }
  return ids
}

/** Lab’da gizlenecek gürültü: tekrarlayan *2/*3 checkpoint yağmuru */
export function isLabNoiseId(id: string): boolean {
  return /(?:2|3|22|23)$/.test(id)
}
