import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/api': {
            target: env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
            changeOrigin: true,
          }
        }
      },
      // Mismo proxy para `vite preview`, así el build de producción se puede
      // probar localmente contra el backend (en prod lo hace nginx).
      preview: {
        proxy: {
          '/api': {
            target: env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
            changeOrigin: true,
          }
        }
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          // El registro lo hace lib/swUpdate.ts, que ademas chequea
          // actualizaciones periodicamente y recarga al activarse una version
          // nueva. Con 'auto' el plugin inyectaria ademas su registro pelado.
          injectRegister: null,
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
            navigateFallback: '/index.html',
            // API routes bypass the SW entirely
            navigateFallbackDenylist: [/^\/api\//],
            runtimeCaching: [
              {
                // Auth + API: always go to network, never cache
                urlPattern: /^https?:\/\/[^/]+\/api\//,
                handler: 'NetworkOnly',
              },
              {
                // Tailwind CDN script (required for styling)
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'cdn-tailwind',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // Google Fonts CSS
                urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'google-fonts-stylesheets' },
              },
              {
                // Google Fonts files
                urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // ESM CDN used by importmap (bundled away in prod but cached if ever requested)
                urlPattern: /^https:\/\/esm\.sh\//,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'esm-sh',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
          },
          manifest: {
            name: 'VetAdmin',
            short_name: 'VetAdmin',
            description: 'Gestión de clínica veterinaria',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            orientation: 'portrait-primary',
            theme_color: '#0d9488',
            background_color: '#ffffff',
            lang: 'es',
            icons: [
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: '/icons/maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
        }),
      ],
    };
});
