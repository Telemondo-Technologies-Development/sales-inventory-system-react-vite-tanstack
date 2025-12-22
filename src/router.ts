// Compatibility shim: re-export the router created in App.tsx
import { router as appRouter } from "./App"

export const router = appRouter
export default router
