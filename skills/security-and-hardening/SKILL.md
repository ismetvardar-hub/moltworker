---
name: security-and-hardening
description: Auth, XSS, secrets, least privilege for LİKYA panel.
---

# Security & Hardening

- Auth header’sız mutasyon yok
- `dangerouslySetInnerHTML` yok (yeni)
- API anahtarları yalnızca env (`VITE_GROQ_API_KEY` vb.)
- Kullanıcı girdisini HTML’e ham basma
- `events.js` / `integrations.js` mühürlü — güvenlik bypass için bile açma
