import type { ComponentType, ReactNode, SVGProps } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { Button } from "../ui/button"

type NavLinkProps = {
  to: string
  children: ReactNode
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  onClick?: () => void
}

export default function NavLink({ to, children, Icon, onClick }: NavLinkProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

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
