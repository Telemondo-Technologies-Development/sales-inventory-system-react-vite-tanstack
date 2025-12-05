import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

import RootLayout from './routes/common/__root'
import RootLogin from './routes/common/authlayout'
import LoginPage from './routes/login-page'
import SalesView from './routes/sales-view'
import Index from './routes/index'
import TabletOrderInterface from './routes/table-order-view'
import OrderView from './routes/order-view'
import InventoryView from './routes/inventory-view'
import AlertView from './routes/alert-view'
import ExpensesView from './routes/expenses-view'

import './styles.css'

// ---- Single root route ----
const rootRoute = createRootRoute()

// ---- Layout routes ----
const appLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: RootLayout,
})

const loginLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: RootLogin,
})

// ---- Page routes ----
const loginRoute = createRoute({
  getParentRoute: () => loginLayout,
  path: '/',
  component: LoginPage,
})

const salesViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/sales-view',
  component: SalesView,
})

const indexRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/index',
  component: Index,
})

const tabletOrderRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/table-orders',
  component: TabletOrderInterface,
})

const orderViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/order-view',
  component: OrderView,
})

const inventoryViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/inventory-view',
  component: InventoryView,
})

const alertViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/alert-view',
  component: AlertView,
})

const expensesViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/expenses-view',
  component: ExpensesView,
})

// ---- Build route tree ----
const routeTree = rootRoute.addChildren([
  loginLayout.addChildren([loginRoute]),
  appLayout.addChildren([salesViewRoute, indexRoute, tabletOrderRoute, orderViewRoute, inventoryViewRoute, alertViewRoute, expensesViewRoute]),
])

const router = createRouter({ routeTree })

// ---- Mount React ----
const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
