import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"


/**
 * main.tsx is the true entrypoint that mounts the app into #root once.
 * This file runs in the browser only (index.html loads it as module).
 */

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element not found")

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)