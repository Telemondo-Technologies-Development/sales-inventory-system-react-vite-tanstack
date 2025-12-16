import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/__root')({
  component: () => (
    <div className="auth-layout">
      <Outlet />
    </div>
  ),
})