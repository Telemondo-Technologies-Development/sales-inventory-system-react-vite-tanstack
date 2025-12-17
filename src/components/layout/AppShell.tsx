
import { Outlet } from "@tanstack/react-router"
import DesktopSidebar from "../navigation/DesktopSidebar"
import MobileHeader from "../navigation/MobileHeader"

export default function AppShell() {
  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <div className="flex h-full">
        <DesktopSidebar />

        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader />

          <main className="p-4 flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
