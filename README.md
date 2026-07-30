# OlymposPass Ekosistemi & LİKYA CEO Paneli

Vite + React + TypeScript + Tailwind CSS ile geliştirilmiş modern yönetim paneli.

## Modüller

| Modül | Açıklama |
|-------|----------|
| **LİKYA CEO Komuta Merkezi** | Genel sistem durumu kartları ve otonom talimat gönderim ekranı |
| **Yerel AI (Ollama Entegrasyonu)** | `http://localhost:11434` üzerindeki Ollama sunucusuyla haberleşir; modelleri (`deepseek-coder`, `qwen2.5`, `llama3`) listeler ve durum kontrolü yapar |
| **IT & AI Ajanlar Paneli** | Kod üretim akışının daktilo efektiyle izlendiği canlı terminal ekranı |
| **OlymposPass Yönetim Paneli** | Kullanıcı geçişleri, erişim yetkileri ve kart/kod doğrulama modülü |

## Kurulum

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak [http://localhost:5173](http://localhost:5173) adresinde açılır.

## Ollama Entegrasyonu

Yerel AI panelinin çalışması için makinenizde [Ollama](https://ollama.com) kurulu ve çalışıyor olmalıdır:

```bash
# Sunucuyu başlat (tarayıcı erişimi için CORS izni ile)
OLLAMA_ORIGINS=* ollama serve

# Hedef modelleri indir
ollama pull deepseek-coder
ollama pull qwen2.5
ollama pull llama3
```

Ollama çalışmıyorsa panel bunu "Çevrimdışı" olarak gösterir; uygulamanın geri kalanı normal çalışmaya devam eder.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlatır (Vite) |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run preview` | Üretim derlemesini yerelde önizler |
| `npm run typecheck` | Yalnızca TypeScript tip kontrolü |

## Teknolojiler

- [Vite 8](https://vitejs.dev) — derleme ve geliştirme sunucusu
- [React 19](https://react.dev) — arayüz
- [Tailwind CSS 4](https://tailwindcss.com) — stil
- [Lucide](https://lucide.dev) — ikonlar
- TypeScript (strict mode)
