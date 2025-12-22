import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { registerSW } from "virtual:pwa-register"



/**
 * main.tsx is the true entrypoint that mounts the app into #root once.
 * This file runs in the browser only (index.html loads it as module).
 */

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element not found")

// Avoid having an old service worker control `vite dev` (it can cause confusing caching/404s).
// Test PWA behavior via `npm run build` + `npm run serve` (production preview).
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
  })
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)