import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'College Management System',
        short_name: 'CMS App',
        description: 'Omni-channel Advanced College Management System',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        // Support XR, Desktop Apps, Tablets and more smoothly
        display_override: ['window-controls-overlay', 'minimal-ui', 'standalone', 'browser'],
        orientation: 'any',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: 'https://cdn-icons-png.freepik.com/512/5650/5650764.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.freepik.com/512/5650/5650764.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
