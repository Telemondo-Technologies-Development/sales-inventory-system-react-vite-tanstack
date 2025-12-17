import NavLink from "./NavLink"
import { useRouter } from "@tanstack/react-router"
import { Users, ClipboardList, Box, DollarSign, Utensils,BanknoteArrowDown  } from "lucide-react"

import { Button } from "../ui/button"
import { LogOut } from "lucide-react"

export default function DesktopSidebar() {
  const router = useRouter()

  const logout = () => {
    try {
      localStorage.removeItem("currentUser")
    } catch {}
    router.navigate({ to: "/login" })
  }

  return (
    <aside className="hidden lg:block w-[200px] elevation-1 h-screen sticky top-0 left-0 bg-primary-foreground">
      <div className="p-4 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <img src="/logo.webp" alt="logo" className="w-8 h-8" />
            <div className="text-base font-semibold">Management</div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink to="/employee" Icon={Users}>
              Employees
            </NavLink>
            <NavLink to="/expenses" Icon={BanknoteArrowDown }>
              Expenses
            </NavLink>
            <NavLink to="/order" Icon={ClipboardList}>
              Orders
            </NavLink>
            <NavLink to="/inventory" Icon={Box}>
              Inventory
            </NavLink>
            <NavLink to="/sales" Icon={DollarSign}>
              Sales
            </NavLink>
            <NavLink to="/table-order" Icon={Utensils}>
              Table Order
            </NavLink>
          </nav>
        </div>

        <div className="px-2">
          <Button
            type="button"
            variant="ghost"
            onClick={logout}
            className="w-full text-red-600 hover:bg-red-50 justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
