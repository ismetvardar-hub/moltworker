/**
 * AŞAMA 22 — Hafif OpenAPI 3 özeti (keşif / dokümantasyon).
 */

export function buildOpenApi() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'LİKYA / OlymposPass Platform API',
      version: '1.0.0',
      description: 'CEO paneli Vite middleware API yüzeyi (AŞAMA 1–27)',
    },
    servers: [{ url: '/' }],
    paths: {
      '/api/health': { get: { summary: 'Healthcheck', tags: ['ops'] } },
      '/api/auth/login': { post: { summary: 'Giriş', tags: ['auth'] } },
      '/api/auth/me': { get: { summary: 'Oturum', tags: ['auth'] } },
      '/api/hub/summary': { get: { summary: 'Hub özeti', tags: ['hub'] } },
      '/api/archive': {
        get: { summary: 'Arşiv listesi', tags: ['archive'] },
        post: { summary: 'Arşiv kaydet', tags: ['archive'] },
      },
      '/api/search': { get: { summary: 'HERODOT arama', tags: ['research'] } },
      '/api/whatsapp/send': { post: { summary: 'WhatsApp gönder', tags: ['integrations'] } },
      '/api/mint/demand': { get: { summary: 'MINT talep matrisi', tags: ['integrations'] } },
      '/api/nexus/devices': { get: { summary: 'NEXUS cihazlar', tags: ['nexus'] } },
      '/api/nexus/command': { post: { summary: 'NEXUS komut', tags: ['nexus'] } },
      '/api/pass/admit': { post: { summary: 'Geçiş onayla', tags: ['pass'] } },
      '/api/pass/verify': { post: { summary: 'Geçiş doğrula', tags: ['pass'] } },
      '/api/venues': { get: { summary: 'Tesisler', tags: ['venues'] } },
      '/api/brands': { get: { summary: 'Markalar', tags: ['brands'] } },
      '/api/brands/active': { post: { summary: 'Aktif marka seç', tags: ['brands'] } },
      '/api/guests': { get: { summary: 'Misafir CRM', tags: ['crm'] } },
      '/api/jobs': { get: { summary: 'Görev kuyruğu', tags: ['jobs'] } },
      '/api/playbooks': { get: { summary: 'Playbook şablonları', tags: ['komuta'] } },
      '/api/webhooks': { get: { summary: 'Webhook listesi', tags: ['webhooks'] } },
      '/api/metrics': { get: { summary: 'Metrikler', tags: ['obs'] } },
      '/api/report': { get: { summary: 'Operasyon raporu', tags: ['report'] } },
      '/api/ops/backup': { get: { summary: 'Yedek indir', tags: ['ops'] } },
      '/api/ops/restore': { post: { summary: 'Yedek geri yükle', tags: ['ops'] } },
      '/api/inventory': { get: { summary: 'Stok envanteri', tags: ['inventory'] } },
      '/api/inventory/adjust': { post: { summary: 'Stok hareketi', tags: ['inventory'] } },
      '/api/shifts': {
        get: { summary: 'Vardiya planı', tags: ['shifts'] },
        post: { summary: 'Vardiya oluştur', tags: ['shifts'] },
      },
      '/api/shifts/{id}': {
        patch: { summary: 'Vardiya güncelle', tags: ['shifts'] },
        delete: { summary: 'Vardiya sil (CEO)', tags: ['shifts'] },
      },
      '/api/openapi.json': { get: { summary: 'OpenAPI JSON', tags: ['docs'] } },
      '/api/docs': { get: { summary: 'API docs alias', tags: ['docs'] } },
      '/api/reservations': {
        get: { summary: 'Rezervasyon listesi', tags: ['reservations'] },
        post: { summary: 'Rezervasyon oluştur', tags: ['reservations'] },
      },
      '/api/loyalty': { get: { summary: 'Sadakat hesapları', tags: ['loyalty'] } },
      '/api/loyalty/adjust': { post: { summary: 'Puan hareketi', tags: ['loyalty'] } },
      '/api/incidents': {
        get: { summary: 'Olay panosu', tags: ['incidents'] },
        post: { summary: 'Manuel olay', tags: ['incidents'] },
      },
      '/api/incidents/{id}/ack': { post: { summary: 'Olay onay/çöz', tags: ['incidents'] } },
      '/api/notifications': { get: { summary: 'Bildirimler', tags: ['notify'] } },
      '/api/events': { get: { summary: 'SSE olay akışı', tags: ['realtime'] } },
      '/api/settings': { get: { summary: 'Ayarlar', tags: ['settings'] } },
    },
  };
}
