import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"

import RootLayout from "./routes/common/__root"
import RootLogin from "./routes/common/authlayout"
import LoginPage from "./routes/login-page"
import SalesView from "./routes/sales-view"
import TabletOrderInterface from "./routes/table-order-view"
import OrderView from "./routes/order-view"
import InventoryView from "./routes/inventory-view"
import ExpensesView from "./routes/expenses-view"
import EmployeeView from "./routes/employee-view"

/**
 * App is a pure React component: no DOM access, no side-effects.
 * Tests can safely render <App /> without causing document.getElementById(...) to run.
 */

const rootRoute = createRootRoute()

const appLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: RootLayout,
})


const loginLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  component: RootLogin,
})

const loginRoute = createRoute({
  getParentRoute: () => loginLayout,
  path: "/",
  component: LoginPage,
})

const salesViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/sales-view",
  component: SalesView,
})

const tabletOrderRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/table-orders",
  component: TabletOrderInterface,
})

const orderViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/order-view",
  component: OrderView,
})

const inventoryViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/inventory-view",
  component: InventoryView,
})

const expensesViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/expenses-view",
  component: ExpensesView,
})

const employeeViewRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/employee-view",
  component: EmployeeView,
})

// EXPOSE employee route at /employees (match LoginPage redirect)
const EmployeeViewOnly = createRoute({
  getParentRoute: () => loginLayout,
  path: "/employees",
  component: TabletOrderInterface,
})

const routeTree = rootRoute.addChildren([
  loginLayout.addChildren([loginRoute]),
  appLayout.addChildren([
    salesViewRoute,
    tabletOrderRoute,
    orderViewRoute,
    inventoryViewRoute,
    expensesViewRoute,
    employeeViewRoute,
    EmployeeViewOnly, 
  ]),
])

const router = createRouter({ routeTree })

export default function App() {
  return <RouterProvider router={router} />
}