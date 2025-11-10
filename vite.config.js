import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',      // kein [::1]
    port: 5173,
    cors: {
      origin: ['http://kigh-anzeigen.loc'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    },
    hmr: {
      host: '127.0.0.1',
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
        'resources/css/components/listings.css'
      ],
      refresh: true,
    }),
    tailwindcss(),
  ],
});
