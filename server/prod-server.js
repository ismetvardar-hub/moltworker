/**
 * AŞAMA 9 — Production sunucu: dist/ + API middleware'leri.
 * Kullanım: npm run build && npm start
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlatformMiddleware } from './platform.js';
import { createIntegrationsMiddleware } from './integrations.js';
import { createSearchMiddleware } from './search-proxy.js';
import { createRateLimitMiddleware } from './rateLimit.js';
import { applySettingsToEnv } from './settings.js';
import { startJobTicker } from './jobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';

applySettingsToEnv();
startJobTicker(5000);

const chain = [
  createRateLimitMiddleware(),
  createSearchMiddleware(),
  createIntegrationsMiddleware(),
  createPlatformMiddleware(),
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const base = path.basename(filePath);
  res.statusCode = 200;
  setSecurityHeaders(res);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');

  // HTML / SW: her zaman taze; hash'li asset'ler uzun cache
  if (ext === '.html' || base === 'sw.js' || ext === '.webmanifest') {
    res.setHeader('Cache-Control', 'no-cache');
  } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  fs.createReadStream(filePath).pipe(res);
}

function serveStatic(req, res) {
  if (!fs.existsSync(DIST)) {
    res.statusCode = 503;
    setSecurityHeaders(res);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('dist/ yok — önce npm run build çalıştırın');
    return;
  }

  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST, safe === '/' ? 'index.html' : safe);

  if (!filePath.startsWith(DIST)) {
    res.statusCode = 403;
    setSecurityHeaders(res);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  // SPA fallback (hash route / bilinmeyen path)
  sendFile(res, path.join(DIST, 'index.html'));
}

function runChain(req, res, index = 0) {
  if (index >= chain.length) {
    serveStatic(req, res);
    return;
  }
  chain[index](req, res, () => runChain(req, res, index + 1));
}

const server = http.createServer((req, res) => {
  runChain(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`[LİKYA] production http://${HOST}:${PORT}`);
  console.log(`[LİKYA] dist=${DIST} data=./data`);
});
