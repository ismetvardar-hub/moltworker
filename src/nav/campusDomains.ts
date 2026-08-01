/**
 * LİKYA Kampüs — CEO menü domain haritası (Adım 1).
 * İnce CRUD’lar Lab’a düşer; burada sadece iş birimi yüzeyleri.
 */

export type CampusDomain = {
  id: string
  label: string
  description: string
  /** Ana sayfa (tıklanınca açılır) */
  primary: string
  /** Domain altında gösterilecek sayfa id’leri (varsa) */
  pages: string[]
}

/** Üst şerit — her zaman menüde */
export const CORE_NAV_IDS = [
  'komuta',
  'campus',
  'brief',
  'hub',
  'extremepark',
  'notifications',
  'ops',
  'settings',
] as const

/**
 * 10 domain hub — vizyon haritası.
 * primary mevcut sayfalara bağlanır; eksik olanlar sonraki adımlarda doldurulur.
 */
export const CAMPUS_DOMAINS: CampusDomain[] = [
  {
    id: 'sport',
    label: 'Spor & Extreme',
    description: 'Slot · waiver · arenalar · lisans kulüp',
    primary: 'extremepark',
    pages: ['extremepark', 'sportslot', 'arenabook', 'nexusgate', 'rentgear', 'tourpack'],
  },
  {
    id: 'stay',
    label: 'Konaklama',
    description: 'Glamping · karavan · bungalow',
    primary: 'staybook',
    pages: ['staybook', 'dazeroom', 'keylessdoor', 'atlas', 'linen', 'roomrack'],
  },
  {
    id: 'market',
    label: 'Pazaryeri',
    description: 'Al · kirala · 2. el',
    primary: 'empire',
    pages: ['empire', 'tybridge', 'dolaplist', 'hephapick', 'rentgear', 'bazaar'],
  },
  {
    id: 'mall',
    label: 'Açık AVM & F&B',
    description: 'Kiracı · restoran · asgari harcama',
    primary: 'hearth',
    pages: ['hearth', 'bazaar', 'retailfloor', 'poslane', 'packfolio'],
  },
  {
    id: 'athlete',
    label: 'Kulüp & Sporcu',
    description: 'Gelişim · antrenman · yaşam uzmanı',
    primary: 'sanctum',
    pages: ['sanctum', 'biomarker', 'sleepcoach', 'nutrition', 'forge', 'traininghub'],
  },
  {
    id: 'family',
    label: 'Aile & Çocuk',
    description: 'Kamp · yaz okulu · güvenli emanet',
    primary: 'serenity',
    pages: ['serenity', 'calmroom', 'welcomeamen', 'guestrequest'],
  },
  {
    id: 'culture',
    label: 'Kültür & Sahne',
    description: 'Müzik · sanat · tiyatro · medya',
    primary: 'studio',
    pages: ['studio', 'aurora', 'livecast', 'mediawall', 'music'],
  },
  {
    id: 'green',
    label: 'Yeşil & Arazi',
    description: 'ESG · orman · su · enerji',
    primary: 'verdant',
    pages: ['verdant', 'reefwatch', 'solaryield', 'wateruse', 'weather'],
  },
  {
    id: 'agents',
    label: 'Ajan Komuta',
    description: 'NEXUS · HEPHAESTUS · REMINDER · MINT · DAZE',
    primary: 'komuta',
    pages: ['komuta', 'ajanlar', 'cognisphere', 'vanguard', 'oracle', 'warroom'],
  },
  {
    id: 'system',
    label: 'Sistem',
    description: 'Ops · yedek · audit · docs',
    primary: 'ops',
    pages: ['ops', 'audit', 'metrics', 'docs', 'settings', 'readiness'],
  },
]

/** Lab’da gizlenecek gürültü: tekrarlayan *2/*3 checkpoint yağmuru */
export function isLabNoiseId(id: string): boolean {
  if (/2$|3$|22$|23$/.test(id) && !['alliance2'].includes(id)) {
    // alliance2 bir checkpoint — lab’a atılabilir
  }
  return /(?:2|3|22|23)$/.test(id)
}
