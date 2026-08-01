import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { herodotSearchPlugin } from './server/search-proxy.js';
import { integrationsPlugin } from './server/integrations.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), herodotSearchPlugin(), integrationsPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
