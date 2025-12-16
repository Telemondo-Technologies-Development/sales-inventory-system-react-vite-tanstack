import React from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "../ui/button"

type NavLinkProps = {
  to: string
  children: React.ReactNode
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  onClick?: () => void
  collapsed?: boolean
}

export default function NavLink({ to, children, Icon, onClick, collapsed = false }: NavLinkProps) {
  const [pathname, setPathname] = React.useState(
    typeof window !== "undefined" ? window.location.pathname : "/",
  )

  React.useEffect(() => {
    const onChange = () => setPathname(window.location.pathname)
    window.addEventListener("popstate", onChange)
    const origPush = history.pushState
    const origReplace = history.replaceState
    history.pushState = function () {
      // @ts-ignore
      origPush.apply(this, arguments)
      window.dispatchEvent(new Event("popstate"))
    }
    history.replaceState = function () {
      // @ts-ignore
      origReplace.apply(this, arguments)
      window.dispatchEvent(new Event("popstate"))
    }
    return () => {
      window.removeEventListener("popstate", onChange)
      history.pushState = origPush
      history.replaceState = origReplace
    }
  }, [])

  const isActive = pathname === to || pathname.startsWith(to + "/")
  const primaryHex = "#266489"
  const inactiveHex = "#181c20"
  const color = isActive ? primaryHex : inactiveHex

  const base =
    "group/nav relative gap-3 w-full text-sm font-semibold rounded-2xl flex items-start justify-start "
  const activeExtras = isActive ? "bg-[#eaf4f8] px-3 py-2 rounded-2xl elevation-1" : "px-2 py-2"

  return (
    <Button asChild variant="ghost" className={`${base} ${activeExtras}`}>
      <Link to={to as any} onClick={onClick} aria-current={isActive ? "page" : undefined} style={{ color }}>
        <div className="hidden lg:flex items-center justify-start ">
          <Icon style={{ color: "currentColor" }} className="w-5 h-5" />
        </div>

        <span className="ml-2 whitespace-nowrap">
          {children}
        </span>
      </Link>
    </Button>
  )
}
