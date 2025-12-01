import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// DO NOT import TanStackRouterDevtools or any router plugin here!

export default defineConfig({
  plugins: [
    devtools(), // for Query
    viteReact(),
    tailwindcss()
  ]
})