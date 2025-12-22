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
      includeAssets: ['logo.svg', 'logo.webp'],
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
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
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