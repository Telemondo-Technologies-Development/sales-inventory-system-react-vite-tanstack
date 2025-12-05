import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'

import Index from './routes/index'
import Profile from './routes/SalesView'
import LoginPage from './routes/LoginPage'


import RootLayout from './routes/__root'
import RootLogin from './routes/authlayout'



import './styles.css'

// ------------------------
// Root Layout
// ------------------------
const rootRoute = createRootRoute({
  component: RootLayout,
})

// ------------------------
// Login Layout (nested)
// ------------------------
const loginLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'loginLayout',
  component: RootLogin,
})

// ------------------------
// Child Routes
// ------------------------
const loginRoute = createRoute({
  getParentRoute: () => loginLayoutRoute,
  path: '/',
  component: LoginPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/index',
  component: Index,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: Profile,
})

// ------------------------
// Route Tree
// ------------------------
const routeTree = rootRoute.addChildren([
  loginLayoutRoute.addChildren([loginRoute]),
  indexRoute,
  profileRoute,
])

// ------------------------
// Router
// ------------------------
const router = createRouter({
  routeTree,
})

import { TanStackRouterDevtoolsInProd } from '@tanstack/react-router-devtools'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <TanStackRouterDevtoolsInProd />
    </>
  )
}
