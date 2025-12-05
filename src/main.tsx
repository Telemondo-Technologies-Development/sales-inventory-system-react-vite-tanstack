import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

import RootLayout from './routes/__root'
import RootLogin from './routes/authlayout'
import LoginPage from './routes/LoginPage'
import SalesView from './routes/SalesView'
import Index from './routes/index'
import TabletOrderInterface from './routes/TableOrderView'
import OrderView from './routes/OrderView'
import InventoryView from './routes/InventoryView'
import AlertView from './routes/alert-view'
import ExpensesView from './routes/ExpensesPage'

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
