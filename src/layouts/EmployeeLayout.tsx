import { Outlet } from "@tanstack/react-router"

export default function EmployeeLayout() {
  return (
    <main className="min-h-screen bg-[#f1f4f9]">
      <Outlet />
    </main>
  )
}
