import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  logLevel: 'silent',
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'EOTC Aququam Library',
        short_name: 'Aququam',
        description: 'Ethiopian Orthodox Tewahedo Church Aququam Audio Library',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000,
    hmr: false,
    ws: false,
    watch: {
      ignored: ['**/db.json']
    }
  },
  optimizeDeps: {
    entries: []
  }
})
