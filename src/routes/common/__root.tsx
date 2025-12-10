import React from "react"
import { Outlet, Link, useNavigate } from "@tanstack/react-router"
import {
  LogOut,
  ListOrdered,
  UserRoundPen,
  AlignStartVertical,
  X,
  View,
  Archive,
  DollarSign,
  IdCardLanyard 
} from "lucide-react"
import LogoUrl from "/logo.webp"

export default function RootLayout() {
  const navigate = useNavigate()

  // Manage mobile sidebar open state
  const [isMobileOpen, setMobileOpen] = React.useState(false)

  // simple pathname watcher so active link styles update
  const [pathname, setPathname] = React.useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  )
  React.useEffect(() => {
    const onChange = () => setPathname(window.location.pathname)
    window.addEventListener("popstate", onChange)

    // Keep router push/replace in sync (small hack to catch history changes)
    const origPush = history.pushState
    const origReplace = history.replaceState
    history.pushState = function () {
      // @ts-ignore forwarding arguments
      origPush.apply(this, arguments)
      window.dispatchEvent(new Event("popstate"))
    }
    history.replaceState = function () {
      // @ts-ignore forwarding arguments
      origReplace.apply(this, arguments)
      window.dispatchEvent(new Event("popstate"))
    }

    return () => {
      window.removeEventListener("popstate", onChange)
      history.pushState = origPush
      history.replaceState = origReplace
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    navigate({ to: "/" })
  }

  // primary color changed by you
  const primaryHex = "#266489" // <-- new primary

  // pick a readable inactive color (neutral)
  const inactiveHex = "#181c20" // gray-500-ish

  type NavLinkProps = {
    to: string
    children: React.ReactNode
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }

  const NavLink: React.FC<NavLinkProps> = ({ to, children, Icon }) => {
    const isActive = pathname === to || pathname.startsWith(to + "/")
    const color = isActive ? primaryHex : inactiveHex

    const base = "group/nav relative flex items-center gap-3 w-full text-sm font-semibold rounded-2xl transition-colors duration-150"
    const activeExtras = isActive ? "bg-[#eaf4f8] px-3 py-2 rounded-2xl shadow-sm" : "px-2 py-2"

    return (
      <Link
        to={to as any}
        onClick={() => setMobileOpen(false)}
        aria-current={isActive ? "page" : undefined}
        style={{ color }}
        className={`${base} ${activeExtras}`}
      >
        <div className="flex items-center justify-center w-8 h-8">
          <Icon style={{ color: "currentColor" }} className="w-5 h-5" />
        </div>

        <span
          className="
            ml-2 whitespace-nowrap
            opacity-0 group-hover:opacity-100
            max-w-0 group-hover:max-w-[200px]
            transition-all duration-180 overflow-hidden
            md:block
          "
        >
          {children}
        </span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#f1f4f9]">
      {/* mobile header */}
      <header className="w-full md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2 rounded-2xl hover:bg-gray-100">
            <AlignStartVertical />
          </button>
          <div className="font-bold text-lg">Serenity</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="flex items-center gap-2 text-[#ba1a1a] px-2 py-1 rounded-2xl hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      {/* desktop sidebar - part of document flow so it PUSHES main content */}
      <aside
        className="hidden md:flex sticky top-0 h-screen w-16 hover:w-[220px] group bg-white text-gray-800 border-r border-gray-200 transition-[width] duration-200 ease-in-out overflow-hidden"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full w-full">
          <div className="px-3 py-4 flex items-center justify-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-white font-bold">
                <img src={LogoUrl}/>
              </div>
              <span className="ml-8 font-bold text-lg truncate text-primary">Serenity</span>
            </div>
          </div>

          <nav className="mt-4 px-2 flex flex-col gap-2 ">
            <NavLink to="/sales-view" Icon={UserRoundPen}>Sales</NavLink>
            <NavLink to="/expenses-view" Icon={DollarSign}>Expenses</NavLink>
            <NavLink to="/order-view" Icon={View}>Order View</NavLink>
            <NavLink to="/table-orders" Icon={ListOrdered}>Table Orders</NavLink>
            <NavLink to="/inventory-view" Icon={Archive}>Inventory View</NavLink>
            <NavLink to="/employee-view" Icon={IdCardLanyard}>Employee</NavLink>
          </nav>

          <div className="mt-auto px-2 py-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-start gap-2 text-[#ba1a1a] bg-transparent hover:bg-red-50 rounded-lg transition-colors px-2 py-2"
            >
              <LogOut className="w-5 h-5 ml-2" />
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* mobile overlay & menu (unchanged) */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isMobileOpen}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <div className="absolute left-0 top-0 bottom-0 w-[250px] bg-white border-r border-gray-200 shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold">
                <img src={LogoUrl}/>
              </div>
              <div className="font-bold">Dashboard</div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-2 rounded hover:bg-gray-100">
              <X />
            </button>
          </div>

          <nav className="mt-4 px-2 flex flex-col gap-2 ">
            <NavLink to="/employee-view" Icon={IdCardLanyard}>Employee</NavLink>
            <NavLink to="/sales-view" Icon={UserRoundPen}>Sales</NavLink>
            <NavLink to="/table-orders" Icon={ListOrdered}>Table Orders</NavLink>
            <NavLink to="/order-view" Icon={View}>Order View</NavLink>
            <NavLink to="/inventory-view" Icon={Archive}>Inventory View</NavLink>
            <NavLink to="/expenses-view" Icon={DollarSign}>Expenses</NavLink>
          </nav>

          <div className="mt-auto pt-6">
            <button onClick={() => { setMobileOpen(false); handleLogout() }} className="w-full flex items-center gap-2 text-[#ba1a1a] bg-transparent hover:bg-red-50 rounded-lg px-2 py-2">
              <LogOut className="w-5 h-5" />
              <span className="ml-2">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* main no longer needs marginLeft; it will be pushed by the sidebar's width */}
      <main className="flex-1 min-h-screen transition-all duration-200 pt-14 md:pt-6" style={{ backgroundColor: "#f1f4f9" }}>
        <div className="p-6 md:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}