import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    devtools(), 
    viteReact(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      // make `@/...` point to `src/...`
      '@': path.resolve(__dirname, 'src'),
    },
  },
})