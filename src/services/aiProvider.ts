/**
 * LİKYA hibrit AI katmanı — Ollama (yerel) öncelik, Groq Free API yedek.
 * Command Center ve ajan çıkarımı bu modülden geçer.
 *
 * Env (opsiyonel):
 *   VITE_GROQ_API_KEY  — Groq ücretsiz anahtar
 *   VITE_GROQ_MODEL    — varsayılan llama-3.3-70b-versatile
 *   VITE_AI_PROVIDER   — "ollama" | "groq" | "auto" (default auto)
 */

import {
  OLLAMA_BASE_URL,
  TARGET_MODELS,
  checkOllamaStatus,
  isModelInstalled,
  listOllamaModels,
  resolveModel,
  streamGenerate as streamOllamaGenerate,
} from './ollama'
import type { OllamaModel, OllamaStatus } from '../types'

export { TARGET_MODELS, OLLAMA_BASE_URL, checkOllamaStatus, listOllamaModels, isModelInstalled, resolveModel }

export type AiProviderId = 'ollama' | 'groq'

export type AiProviderInfo = {
  active: AiProviderId
  ollama: OllamaStatus
  groqConfigured: boolean
  note: string
}

const ETHOS_SYSTEM =
  'Sen OlymposPass Ekosistemi için çalışan LİKYA adlı otonom bir yazılım ajanısın. ' +
  'Üslubun sade, naif ve zarif esprili olmalı (ETHOS: Centilmenlik · Naiflik · Esprili Üslup). ' +
  'Küfürlü veya kaba espri kullanma. Kod bloklarını markdown biçiminde döndür. Kısa ve net yaz.'

function preferredProvider(): 'ollama' | 'groq' | 'auto' {
  const raw = String(import.meta.env.VITE_AI_PROVIDER || 'auto').toLowerCase()
  if (raw === 'ollama' || raw === 'groq' || raw === 'auto') return raw
  return 'auto'
}

function groqApiKey(): string {
  return String(import.meta.env.VITE_GROQ_API_KEY || '').trim()
}

function groqModel(): string {
  return String(import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile').trim()
}

export function isGroqConfigured(): boolean {
  return groqApiKey().length > 0
}

/** Aktif sağlayıcıyı raporlar (panel / debug). */
export async function getAiProviderInfo(): Promise<AiProviderInfo> {
  const ollama = await checkOllamaStatus()
  const groqConfigured = isGroqConfigured()
  const pref = preferredProvider()

  if (pref === 'groq' && groqConfigured) {
    return {
      active: 'groq',
      ollama,
      groqConfigured,
      note: 'Zorunlu Groq modu',
    }
  }
  if (pref === 'ollama') {
    return {
      active: 'ollama',
      ollama,
      groqConfigured,
      note: ollama.reachable ? 'Yerel Ollama' : 'Ollama kapalı — yanıt üretilemeyebilir',
    }
  }
  if (ollama.reachable) {
    return {
      active: 'ollama',
      ollama,
      groqConfigured,
      note: 'Ollama öncelik (auto)',
    }
  }
  if (groqConfigured) {
    return {
      active: 'groq',
      ollama,
      groqConfigured,
      note: 'Ollama yok — Groq Free yedek',
    }
  }
  return {
    active: 'ollama',
    ollama,
    groqConfigured,
    note: 'Ollama ve Groq yok — simülasyon / hata yolu',
  }
}

async function* streamGroqGenerate(prompt: string, signal?: AbortSignal): AsyncGenerator<string> {
  const key = groqApiKey()
  if (!key) throw new Error('Groq API anahtarı yok (VITE_GROQ_API_KEY)')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: groqModel(),
      stream: true,
      temperature: 0.4,
      messages: [
        { role: 'system', content: ETHOS_SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Groq isteği başarısız (HTTP ${res.status})${detail ? `: ${detail}` : ''}`)
  }
  if (!res.body) throw new Error('Groq akış gövdesi boş')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const token = json.choices?.[0]?.delta?.content
          if (token) yield token
        } catch {
          // kısmi SSE satırı — yut
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Hibrit stream: Ollama → (başarısız/kapalıysa) Groq.
 * Command Center mevcut imzayı korur: (model, prompt, signal?).
 */
export async function* streamGenerate(
  model: string,
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const pref = preferredProvider()
  const info = await getAiProviderInfo()

  if (pref === 'groq' || (pref === 'auto' && info.active === 'groq')) {
    yield* streamGroqGenerate(prompt, signal)
    return
  }

  try {
    yield* streamOllamaGenerate(model, prompt, signal)
  } catch (err) {
    if (!isGroqConfigured()) throw err
    // Ollama düştüyse Groq Free yedek
    yield* streamGroqGenerate(prompt, signal)
  }
}

/** Tek seferlik (stream’siz) kolaylık sarmalayıcısı. */
export async function completePrompt(
  model: string,
  prompt: string,
  signal?: AbortSignal,
): Promise<{ provider: AiProviderId; text: string }> {
  const info = await getAiProviderInfo()
  let text = ''
  for await (const token of streamGenerate(model, prompt, signal)) {
    text += token
  }
  return { provider: info.active, text }
}

/** Kurulu model yoksa bile güvenli fallback adı. */
export function pickRuntimeModel(installed: OllamaModel[], preferred = 'qwen2.5'): string {
  return resolveModel(preferred, installed, preferred)
}
