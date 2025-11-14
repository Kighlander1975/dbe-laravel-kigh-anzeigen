import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

// Vom Handy/anderen PCs erreichbar (DNS-Name oder LAN-IP)
const hmrHost = 'schulung.fritz.box';
// Deine App-Hostnamen, von der aus die Seite geladen wird
const localAppHost = 'kigh-anzeigen.loc';

export default defineConfig({
  server: {
    host: '0.0.0.0', // lauscht auf allen Interfaces (LAN)
    port: 5173,
    strictPort: true,
    cors: {
      origin: [
        `http://${localAppHost}`,
        `http://${hmrHost}`,
      ],
      methods: ['GET', 'POST', 'PUT,', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    },
    hmr: {
      host: hmrHost, // Hostname, den Clients im LAN erreichen
      port: 5173,
      protocol: 'ws', // für Vite-HMR ist ws üblich; http funktioniert teils, ws ist robuster
    },
  },
  plugins: [
    laravel({
      // Stelle sicher, dass @vite([...]) diese Inputs nutzt
      input: [
        'resources/css/header.css',
        'resources/css/footer.css',
        'resources/css/components/listings.css',
        'resources/css/components/flashmessages.css',
        'resources/css/main.css',
        'resources/css/components/show_listing.css',
        'resources/css/auth.css',
        'resources/css/profile.css',
        'resources/js/mein_js.js',
        // Tipp: Langfristig eine zentrale resources/css/app.css mit @import nutzen
      ],
      refresh: true,
    }),
    tailwindcss(),
  ],
});