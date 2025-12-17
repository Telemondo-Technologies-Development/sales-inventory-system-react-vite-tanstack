import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { VitePWA } from 'vite-plugin-pwa'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


export default defineConfig({
  plugins: [
    devtools({ eventBusConfig: { port: 42070 } }), 
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.ico', 'logo.svg', 'logo.webp', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'Restaurant Business Management',
        short_name: 'Management',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff',
        icons: [
          {
            src: '/logo192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        cleanupOutdatedCaches: true,
      },
    })
  ],
  resolve: {
    alias: {
      // make `@/...` point to `src/...`
      '@': path.resolve(__dirname, 'src'),
    },
  },
})