import { Link, useRouter } from "@tanstack/react-router"
import { Menu } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "../ui/button"

export default function MobileHeader() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  const logout = () => {
    try {
      localStorage.removeItem("currentUser")
    } catch {}
    setOpen(false)
    router.navigate({ to: "/login" })
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = dropdownRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown)
    }
  }, [open])

  return (
    <div className="lg:hidden w-full border-b bg-white/60 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 relative" ref={dropdownRef}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="logo" className="w-8 h-8" />
              <h1 className="text-lg font-semibold">Management</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-10 p-0"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {open && (
            <div className="absolute right-0 top-13 w-56 rounded-2xl border bg-white overflow-hidden">
              <div className="p-2 flex flex-col gap-1">
                <Link
                  to={"/employee" as any}
                  className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Employees
                </Link>
                <Link
                  to={"/order" as any}
                  className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  to={"/inventory" as any}
                  className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Inventory
                </Link>
                <Link
                  to={"/sales" as any}
                  className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Sales
                </Link>
                <Link
                  to={"/table-order" as any}
                  className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Table Order
                </Link>



                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-left"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
