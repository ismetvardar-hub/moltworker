import { AGENTS } from '../data/agents';
import type { Assignment } from '../types';

interface RoutingRule {
  agentId: string;
  keywords: string[];
  subtask: string;
}

/**
 * LİKYA-1'in anahtar kelime tabanlı görev dağıtım matrisi (26 ajan / 9 departman).
 * Bir talimat birden fazla kurala uyarsa ilgili tüm ajanlara iş düşer.
 */
const ROUTING_RULES: RoutingRule[] = [
  // C-Suite & Stratejik Komuta
  {
    agentId: 'daze-hub',
    keywords: ['daze hub', 'merkezi beyin', 'sistem performans', 'veri akışı'],
    subtask: 'Merkezi veri ve performans koordinasyonu',
  },

  // Teknoloji, Bulut & Yazılım
  {
    agentId: 'atlas',
    keywords: ['api', 'backend', 'veritabanı', 'postgresql', 'redis', 'mikroservis', 'endpoint', 'sunucu', 'fonksiyon', 'kod', 'python'],
    subtask: 'Backend/API geliştirme',
  },
  {
    agentId: 'phaselis',
    keywords: ['web', 'arayüz', 'panel', 'portal', 'sayfa', 'frontend', 'responsive', 'react'],
    subtask: 'Web arayüzü geliştirme',
  },
  {
    agentId: 'olympos-mobile',
    keywords: ['mobil', 'ios', 'android', 'flutter', 'react native', 'cüzdan uygulaması'],
    subtask: 'Mobil uygulama geliştirme',
  },
  {
    agentId: 'chimera',
    keywords: ['güvenlik', 'penetrasyon', 'owasp', 'auth', 'yetkilendirme', 'siber', 'qa testi'],
    subtask: 'Güvenlik denetimi ve QA',
  },
  {
    agentId: 'nexus',
    keywords: ['iot', 'turnike', 'rfid', 'esp32', 'raspberry', 'donanım', 'sensör', 'mutfak ekranı', 'kapı geçiş'],
    subtask: 'IoT ve donanım entegrasyonu',
  },

  // Satın Alma, Depo & Stok
  {
    agentId: 'agora',
    keywords: ['tedarik', 'satın alma', 'fiyat teklifi', 'tedarikçi', 'hammadde', 'sipariş hazırla'],
    subtask: 'Tedarik ve satın alma süreci',
  },
  {
    agentId: 'hephaestus',
    keywords: ['stok', 'depo', 'reçete', 're-order', 'envanter'],
    subtask: 'Depo ve stok takibi',
  },
  {
    agentId: 'logos',
    keywords: ['lojistik', 'teslimat', 'rota', 'soğuk zincir', 'termal'],
    subtask: 'Lojistik ve soğuk zincir planlaması',
  },

  // Hukuk, Uyum & Risk
  {
    agentId: 'themis',
    keywords: ['sözleşme', 'nda', 'hukuk', 'şartname', 'gizlilik metni'],
    subtask: 'Hukuki metin hazırlığı',
  },
  {
    agentId: 'valkyrie',
    keywords: ['kvkk', 'gdpr', 'veri koruma', 'biyometrik', 'uyum raporu'],
    subtask: 'KVKK/GDPR uyum denetimi',
  },
  {
    agentId: 'veritas',
    keywords: ['marka tescil', 'telif', 'lisans', 'patent', 'fikri mülkiyet'],
    subtask: 'Fikri mülkiyet koruması',
  },

  // Satış, İş Geliştirme & CRM
  {
    agentId: 'hermes-sales',
    keywords: ['satış', 'b2b', 'kurumsal paket', 'teklif hazırla', 'sunum', 'fiyatlama stratejisi'],
    subtask: 'Kurumsal satış teklifi',
  },
  {
    agentId: 'daze-vision',
    keywords: ['müşteri deneyimi', 'yaşam koçu', 'kıyafet', 'buzdolabı', 'daze vision'],
    subtask: 'Müşteri deneyimi tasarımı',
  },
  {
    agentId: 'reminder-ai',
    keywords: ['whatsapp', 'hatırlatma', 'bildirim', 'sipariş hazır', 'reminder'],
    subtask: 'WhatsApp bildirim akışı',
  },
  {
    agentId: 'aura',
    keywords: ['sadakat', 'hediye', 'ikram', 'puan', 'daze-gift', 'daze gift'],
    subtask: 'Sadakat ve ödül planlaması',
  },

  // Kreatif, Medya & Pazarlama
  {
    agentId: 'arte',
    keywords: ['görsel', 'tasarım', 'afiş', 'poster', 'logo', 'banner', 'illüstrasyon'],
    subtask: 'Görsel/afiş üretimi',
  },
  {
    agentId: 'prometheus',
    keywords: ['video', 'shorts', 'reels', 'motion', 'animasyon', 'kurgu'],
    subtask: 'Video içerik üretimi',
  },
  {
    agentId: 'kalypso',
    keywords: ['metin', 'slogan', 'lansman', 'blog', 'hikaye', 'kampanya', 'post'],
    subtask: 'Kreatif metin üretimi',
  },
  {
    agentId: 'babel',
    keywords: ['çevir', 'çeviri', 'ingilizce', 'almanca', 'rusça', 'arapça', 'lokalizasyon', 'dil'],
    subtask: 'Çoklu dil çevirisi',
  },

  // İnsan Kaynakları & Operasyon
  {
    agentId: 'daze-crew',
    keywords: ['personel', 'vardiya', 'saatlik kazanç', 'performans puan', 'daze crew'],
    subtask: 'Personel portalı ve vardiya takibi',
  },
  {
    agentId: 'socrates',
    keywords: ['eğitim', 'akademi', 'nezaket eğitimi', 'simülasyon senaryo'],
    subtask: 'Nezaket akademisi eğitimi',
  },

  // Finans, Fiyatlandırma & Borsa
  {
    agentId: 'plutus',
    keywords: ['bütçe', 'harcama', 'maliyet', 'gider', 'api harcama'],
    subtask: 'Bütçe ve maliyet analizi',
  },
  {
    agentId: 'mint',
    keywords: ['borsa', 'dinamik fiyat', 'fiyat esnet', 'yoğunluk fiyat'],
    subtask: 'Dinamik fiyatlama algoritması',
  },

  // AR-GE & Pazar İstihbaratı
  {
    agentId: 'herodot',
    keywords: ['rakip', 'pazar araştırma', 'istihbarat', 'trend tara', 'pazar analizi'],
    subtask: 'Pazar ve rakip istihbaratı',
  },
  {
    agentId: 'odysseus',
    keywords: ['yeni model', 'deepseek-r1', 'llama-3.3', 'açık kaynak model', 'model test'],
    subtask: 'Yeni AI model entegrasyonu',
  },

  // Genel raporlama (DAZE-HUB'a düşer)
  {
    agentId: 'daze-hub',
    keywords: ['rapor', 'analiz', 'istatistik', 'metrik'],
    subtask: 'Veri analizi ve raporlama',
  },
];

function toAssignment(agentId: string, subtask: string): Assignment | null {
  const agent = AGENTS.find((a) => a.id === agentId);
  return agent ? { agentId: agent.id, agentName: agent.name, subtask } : null;
}

/**
 * LİKYA-1: CEO talimatını analiz eder ve ilgili ajanlara alt görev dağıtır.
 * - Hiçbir kural eşleşmezse talimat varsayılan olarak ATLAS'a yönlendirilir.
 * - Master Kural gereği her dağıtıma ETHOS üslup denetimi eklenir.
 */
export function routeDirective(directive: string): Assignment[] {
  const text = ` ${directive.toLowerCase()} `;
  const assignments: Assignment[] = [];

  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      const found = toAssignment(rule.agentId, rule.subtask);
      if (found && !assignments.some((a) => a.agentId === found.agentId)) {
        assignments.push(found);
      }
    }
  }

  if (assignments.length === 0) {
    const fallback = toAssignment('atlas', 'Genel teknik görev');
    if (fallback) assignments.push(fallback);
  }

  // Master Kural: ETHOS her çıktıyı centilmenlik/naiflik/espri filtresinden geçirir.
  const ethos = toAssignment('ethos', 'Üslup ve nezaket denetimi (Master Kural)');
  if (ethos && !assignments.some((a) => a.agentId === ethos.agentId)) {
    assignments.push(ethos);
  }

  return assignments;
}
