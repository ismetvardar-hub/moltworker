/**
 * AŞAMA 59 — Sahil / dış mekan hava brifi (mock + opsiyonel).
 */
import { appendAudit } from './audit.js';

const CONDITIONS = [
  { code: 'clear', label: 'Açık', tip: 'Sahil doluluk yüksek beklenir' },
  { code: 'partly', label: 'Parçalı bulutlu', tip: 'Normal operasyon' },
  { code: 'windy', label: 'Rüzgarlı', tip: 'Şezlong sabitleme kontrolü' },
  { code: 'rain', label: 'Yağış riski', tip: 'Kapalı alan rezervasyonlarına kaydır' },
];

export function buildWeatherBrief(venueId = 'venue_olympos_beach') {
  // deterministik günlük seçim
  const day = new Date().toISOString().slice(0, 10);
  const idx = day.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % CONDITIONS.length;
  const c = CONDITIONS[idx];
  const tempC = 28 + (idx % 5);
  const windKph = 8 + idx * 4;
  return {
    date: day,
    venueId,
    condition: c.code,
    label: c.label,
    tip: c.tip,
    tempC,
    windKph,
    humidity: 45 + idx * 5,
    generatedAt: new Date().toISOString(),
    source: 'mock-likya',
  };
}

export function refreshWeather(actor = 'system') {
  const brief = buildWeatherBrief();
  appendAudit({
    actor,
    action: 'weather.refresh',
    detail: `${brief.label} · ${brief.tempC}°C`,
    meta: { condition: brief.condition },
  });
  return brief;
}
