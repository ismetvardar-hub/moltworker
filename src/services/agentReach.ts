/**
 * Agent Reach — ücretsiz web gözü (Jina / Reddit / GitHub JSON).
 * Panniantong/agent-reach mantığının tarayıcı-uyumlu LİKYA adaptasyonu.
 *
 * Shell tarafı (gh, yt-dlp) için bkz. `.agents/agent-reach.md`.
 */

export type AgentReachDoc = {
  url: string
  title?: string
  markdown: string
  provider: 'jina' | 'reddit' | 'x' | 'raw'
  fetchedAt: string
}

export type RedditHotItem = {
  title: string
  url: string
  score: number
  subreddit: string
  permalink: string
}

const UA = 'likya-agent-reach/1.0'

function jinaUrl(target: string): string {
  const normalized = target.startsWith('http') ? target : `https://${target}`
  return `https://r.jina.ai/${normalized}`
}

/** Herhangi bir URL’yi Jina Reader ile Markdown olarak oku (0 TL). */
export async function readUrlAsMarkdown(
  url: string,
  signal?: AbortSignal,
): Promise<AgentReachDoc> {
  const endpoint = jinaUrl(url)
  const res = await fetch(endpoint, {
    signal,
    headers: { Accept: 'text/plain', 'User-Agent': UA },
  })
  if (!res.ok) {
    throw new Error(`Jina Reader HTTP ${res.status} — ${url}`)
  }
  const markdown = await res.text()
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  return {
    url,
    title: titleMatch?.[1]?.trim(),
    markdown: markdown.slice(0, 120_000),
    provider: 'jina',
    fetchedAt: new Date().toISOString(),
  }
}

/** Reddit hot — public JSON (login yok). */
export async function fetchRedditHot(
  subreddit: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<RedditHotItem[]> {
  const sub = subreddit.replace(/^r\//, '').trim() || 'programming'
  const endpoint = `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=${Math.min(25, Math.max(1, limit))}`
  const res = await fetch(endpoint, {
    signal,
    headers: { Accept: 'application/json', 'User-Agent': UA },
  })
  if (!res.ok) {
    throw new Error(`Reddit HTTP ${res.status} — r/${sub}`)
  }
  const data = (await res.json()) as {
    data?: { children?: Array<{ data?: Record<string, unknown> }> }
  }
  return (data.data?.children || [])
    .map((c) => c.data || {})
    .filter((d) => d.title)
    .map((d) => ({
      title: String(d.title),
      url: String(d.url || ''),
      score: Number(d.score || 0),
      subreddit: String(d.subreddit || sub),
      permalink: `https://www.reddit.com${String(d.permalink || '')}`,
    }))
}

/** GitHub public README (API, token opsiyonel). */
export async function fetchGithubReadme(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<AgentReachDoc> {
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw',
    'User-Agent': UA,
  }
  const token = String(import.meta.env.VITE_GITHUB_TOKEN || '').trim()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(endpoint, { signal, headers })
  if (!res.ok) {
    throw new Error(`GitHub README HTTP ${res.status} — ${owner}/${repo}`)
  }
  const markdown = await res.text()
  return {
    url: `https://github.com/${owner}/${repo}`,
    title: `${owner}/${repo} README`,
    markdown: markdown.slice(0, 120_000),
    provider: 'raw',
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Twitter/X durum veya profil URL’sini Jina Reader ile oku (0 TL, login yok).
 * Örnek: https://x.com/user/status/123
 */
export async function readXPostAsMarkdown(
  url: string,
  signal?: AbortSignal,
): Promise<AgentReachDoc> {
  const normalized = url
    .replace('twitter.com', 'x.com')
    .replace('mobile.twitter.com', 'x.com')
  const doc = await readUrlAsMarkdown(normalized, signal)
  return { ...doc, provider: 'x', url: normalized }
}

/** Araştırma bulgularını modele beslemek için kısa bağlam paketi. */
export function packReachContext(docs: AgentReachDoc[]): string {
  return docs
    .map(
      (d, i) =>
        `[${i + 1}] ${d.title || d.url}\nKaynak: ${d.url} (${d.provider})\n---\n${d.markdown.slice(0, 4000)}\n`,
    )
    .join('\n')
}
