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
import LoginPage from './routes/login'
import Profile from './routes/profile'
import Index from './routes/index'
import TabletOrderInterface from './routes/table-orders'
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

const profileRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/profile',
  component: Profile,
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

// ---- Build route tree ----
const routeTree = rootRoute.addChildren([
  loginLayout.addChildren([loginRoute]),
  appLayout.addChildren([profileRoute, indexRoute, tabletOrderRoute]),
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
