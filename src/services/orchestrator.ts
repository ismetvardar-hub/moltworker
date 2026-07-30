import { AGENTS } from '../data/agents';
import type { Assignment } from '../types';

interface RoutingRule {
  agentId: string;
  keywords: string[];
  subtask: string;
}

/**
 * LİKYA-1'in anahtar kelime tabanlı görev dağıtım matrisi.
 * Bir talimat birden fazla kurala uyarsa ilgili tüm ajanlara iş düşer.
 */
const ROUTING_RULES: RoutingRule[] = [
  {
    agentId: 'arte',
    keywords: ['görsel', 'tasarım', 'afiş', 'poster', 'logo', 'banner', 'resim'],
    subtask: 'Görsel/afiş üretimi',
  },
  {
    agentId: 'prometheus',
    keywords: ['video', 'tanıtım filmi', 'motion', 'animasyon', 'senaryo'],
    subtask: 'Video içerik ve senaryo üretimi',
  },
  {
    agentId: 'hermes',
    keywords: ['sosyal medya', 'instagram', 'linkedin', 'twitter', ' x ', 'paylaşım', 'post'],
    subtask: 'Sosyal medya içeriği ve paylaşım takvimi',
  },
  {
    agentId: 'kalypso',
    keywords: ['metin', 'slogan', 'lansman', 'blog', 'hikaye', 'kampanya', 'içerik yaz'],
    subtask: 'Kreatif metin üretimi',
  },
  {
    agentId: 'babel',
    keywords: ['çevir', 'çeviri', 'ingilizce', 'almanca', 'rusça', 'fransızca', 'lokalizasyon', 'dil'],
    subtask: 'Çoklu dil çevirisi ve lokalizasyon',
  },
  {
    agentId: 'olympos-mobile',
    keywords: ['mobil', 'ios', 'android', 'flutter', 'react native', 'uygulama mağaza'],
    subtask: 'Mobil uygulama geliştirme',
  },
  {
    agentId: 'phaselis',
    keywords: ['web', 'arayüz', 'panel', 'portal', 'sayfa', 'frontend', 'responsive'],
    subtask: 'Web arayüzü geliştirme',
  },
  {
    agentId: 'atlas',
    keywords: ['api', 'backend', 'veritabanı', 'fonksiyon', 'kod', 'python', 'endpoint', 'sunucu'],
    subtask: 'Backend/API geliştirme',
  },
  {
    agentId: 'chimera',
    keywords: ['güvenlik', 'test', 'denetim', 'yetkilendirme', 'auth', 'penetrasyon', 'qa'],
    subtask: 'Güvenlik denetimi ve QA testleri',
  },
  {
    agentId: 'hermes-comm',
    keywords: ['whatsapp', 'bildirim', 'hatırlatma', 'uyarı', 'mesaj gönder', 'reminder'],
    subtask: 'WhatsApp bildirim ve hatırlatma akışı',
  },
  {
    agentId: 'minos',
    keywords: ['rapor', 'analiz', 'istatistik', 'metrik', 'etkileşim', 'veri'],
    subtask: 'Veri analizi ve raporlama',
  },
];

/**
 * LİKYA-1: CEO talimatını analiz eder ve ilgili ajanlara alt görev dağıtır.
 * Hiçbir kural eşleşmezse talimat varsayılan olarak ATLAS'a yönlendirilir.
 */
export function routeDirective(directive: string): Assignment[] {
  const text = ` ${directive.toLowerCase()} `;
  const assignments: Assignment[] = [];

  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      const agent = AGENTS.find((a) => a.id === rule.agentId);
      if (agent) {
        assignments.push({ agentId: agent.id, agentName: agent.name, subtask: rule.subtask });
      }
    }
  }

  if (assignments.length === 0) {
    const atlas = AGENTS.find((a) => a.id === 'atlas');
    if (atlas) {
      assignments.push({
        agentId: atlas.id,
        agentName: atlas.name,
        subtask: 'Genel teknik görev',
      });
    }
  }

  return assignments;
}
