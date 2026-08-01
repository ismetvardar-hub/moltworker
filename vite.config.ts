import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { herodotSearchPlugin } from './server/search-proxy.js';
import { integrationsPlugin } from './server/integrations.js';
import { platformPlugin } from './server/platform.js';
import { createRateLimitMiddleware } from './server/rateLimit.js';

function rateLimitPlugin() {
  return {
    name: 'likya-rate-limit',
    configureServer(server) {
      server.middlewares.use(createRateLimitMiddleware());
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    rateLimitPlugin(),
    herodotSearchPlugin(),
    integrationsPlugin(),
    platformPlugin(),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
