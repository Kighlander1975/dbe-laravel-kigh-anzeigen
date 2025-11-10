import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

const hmrHost = 'schulung.fritz.box';    // vom Handy/anderen PCs erreichbar
const localAppHost = 'kigh-anzeigen.loc'; // lokal auf dem Schulungsrechner

export default defineConfig({
  server: {
    host: '0.0.0.0',      // lauscht auf allen Interfaces (wichtig fürs LAN)
    port: 5173,
    strictPort: true,
    cors: {
      origin: [
        `http://${localAppHost}`,
        `http://${hmrHost}`,
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    },
    hmr: {
      host: hmrHost,      // HMR-Host muss im LAN auflösbar sein
      port: 5173,
      protocol: 'http'
    }
  },
  plugins: [
    laravel({
      // Falls du Blade nutzt, stelle sicher, dass @vite(...) verwendet wird
      input: [
        'resources/css/header.css',
        'resources/css/footer.css',
        'resources/css/components/listings.css',
        'resources/css/components/flashmessages.css',
        // Optional später: eine zentrale resources/css/app.css mit @import verwenden
      ],
      refresh: true,
    }),
    tailwindcss(),
  ],
});
