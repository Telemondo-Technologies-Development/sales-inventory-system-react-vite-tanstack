import { Outlet } from '@tanstack/react-router'

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#475d92]">
      <Outlet />
    </main>
  )
}