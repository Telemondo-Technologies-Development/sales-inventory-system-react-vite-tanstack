import { Outlet, createRootRoute, redirect, useRouterState } from '@tanstack/react-router'
import AppShell from '@/components/layout/AppShell'
import { getCurrentUser } from '@/lib/auth'

function RootLayout() {
  // read route match state and current user without conditional hooks
  const isHeaderlessRoute = useRouterState({
    select: (s) => s.matches.some((m) => String(m.routeId).startsWith('/(auth)/') || String(m.routeId).startsWith('/(employee)/')),
  })

  const user = getCurrentUser()
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'

  if (isHeaderlessRoute) return <Outlet />
  if (!isAdmin) return <Outlet />

  return <AppShell />
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const user = getCurrentUser()
    const role = String(user?.role || '').toLowerCase()
    const path = location.pathname

    if (role !== 'admin') {
      // Auth pages always allowed
      if (path === '/login') return

      const tasks = (user?.tasks ?? []).map((t) => String(t).toLowerCase())
      const allowTableOrder = tasks.includes('waiter')
      const allowInventory =
        tasks.includes('inventory') || tasks.includes('kitchen') || tasks.includes('runner') || tasks.includes('bar')
      const allowOrder = tasks.includes('cashier')

      const allowed =
        (allowTableOrder && (path === '/table-order' || path.startsWith('/table-order/')))
        || (allowInventory && (path === '/inventory' || path.startsWith('/inventory/')))
        || (allowOrder && (path === '/order' || path.startsWith('/order/')))

      if (!allowed) {
        if (allowTableOrder) throw redirect({ to: '/table-order' })
        if (allowOrder) throw redirect({ to: '/order' })
        if (allowInventory) throw redirect({ to: '/inventory' })
        throw redirect({ to: '/login' })
      }
    }
  },
  component: RootLayout,
})