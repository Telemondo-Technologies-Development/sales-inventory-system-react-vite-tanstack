import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"

import RootLayout from "./layouts/RootLayout"
import AuthLayout from "./layouts/AuthLayout"
import EmployeeLayout from "./layouts/EmployeeLayout"

import LoginPage from "./routes/login-page"
import SalesView from "./routes/sales-view"
import TabletOrderInterface from "./routes/table-order-view"
import OrderView from "./routes/order-view"
import InventoryView from "./routes/inventory-view"
import ExpensesView from "./routes/expenses-view"
import EmployeeView from "./routes/employee-view"
import OnlyEmployee from "./routes/table-order-view"

const rootRoute = createRootRoute()

const appLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: RootLayout,
})

const loginLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  component: AuthLayout,
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

// expose at /employees as well (login redirect expects this)
const employeeAliasRoute = createRoute({
  getParentRoute: () => loginLayout,
  path: "/employees",
  component: OnlyEmployee,
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
    employeeAliasRoute,
  ]),
])

const router = createRouter({ routeTree })

export default router
