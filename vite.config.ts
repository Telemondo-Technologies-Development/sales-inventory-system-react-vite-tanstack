import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


export default defineConfig({
  plugins: [
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