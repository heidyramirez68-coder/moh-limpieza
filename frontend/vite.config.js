import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'MOH Limpieza',
        short_name: 'MOH',
        description: 'Gestión de limpieza — Mission of Hope',
        theme_color: '#7C3AED',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      },
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/tareas\/dia\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tareas-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            }
          },
          {
            urlPattern: /^\/api\/areas/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'areas-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: /^\/api\/usuarios/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'usuarios-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true }
    }
  }
})
