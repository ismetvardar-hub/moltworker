/**
 * AŞAMA 75 — CEO digest (hazırlık + brief + sinyal birleşimi).
 */
import { buildReadiness } from './readiness.js';
import { buildDailyBrief } from './brief.js';
import { buildWeatherBrief } from './weather.js';
import { feedbackSummary } from './feedback.js';
import { cashSummary } from './cash.js';
import { tipSummary } from './tips.js';

export function buildDigest() {
  const ready = buildReadiness();
  const brief = buildDailyBrief();
  const weather = buildWeatherBrief();
  const fb = feedbackSummary();
  const cash = cashSummary();
  const tips = tipSummary();
  return {
    generatedAt: new Date().toISOString(),
    readiness: { overall: ready.overall, grade: ready.grade },
    headlines: brief.headlines,
    weather: { label: weather.label, tempC: weather.tempC, tip: weather.tip },
    nps: fb.nps,
    cashBalance: cash.drawer?.balance ?? 0,
    tipBalance: tips.balance,
    signals: ready.signals,
    dimensions: ready.dimensions,
  };
}
