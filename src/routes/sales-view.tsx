

import { useEffect, useMemo, useState } from "react"
import { getExpenses } from "../database/expenses-helper/ExpensesDexieDB"
import { getOrders } from "../database/order-helper/OrderDexieDB"
import {
  RevenueLineChart,
  SalesBarChart,
  TopItemsPie,
} from "../components/sales-system/SalesDetails"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Order } from "../database/order-helper/OrderDexieDB"
import type { Expense } from "../database/expenses-helper/ExpensesDexieDB" 
 



export default function SalesView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [o, ex] = await Promise.all([getOrders(), getExpenses()])
        if (!mounted) return
        setOrders(o)
        setExpenses(ex)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.createdAt)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(dateTo)) return false
      return true
    })
  }, [orders, dateFrom, dateTo])

  // KPIs
  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0), [filteredOrders])
  const totalOrders = filteredOrders.length
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (Number(e.cost) || 0), 0), [expenses])
  const profit = totalRevenue - totalExpenses

  // Sales over time (grouped by day)
  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of filteredOrders) {
      const d = new Date(o.createdAt).toISOString().slice(0, 10) // YYYY-MM-DD
      map.set(d, (map.get(d) || 0) + (Number(o.total) || 0))
    }
    const arr = Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => (sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
    return arr
  }, [filteredOrders, sortOrder])

  // Orders count by day
  const ordersByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of filteredOrders) {
      const d = new Date(o.createdAt).toISOString().slice(0, 10)
      map.set(d, (map.get(d) || 0) + 1)
    }
    const arr = Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
    return arr
  }, [filteredOrders, sortOrder])

  // Top items
  const topItems = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      for (const it of o.items) {
        map.set(it.name, (map.get(it.name) || 0) + (it.quantity || 0))
      }
    }
    const arr = Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
    return arr
  }, [orders])

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start bg-primary-foreground rounded-xl p-2 elevation-1 ">
        <div>
          <h1 className="text-2xl font-medium text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of sales, revenue and expenses</p>
        </div>

        <div className="mt-3 lg:mt-0 flex flex-col gap-2 lg:flex-row lg:items-center h-13 ">
          <div className="flex gap-2 items-center ">
            <label className="text-xs text-muted-foreground">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1 text-xs" />
            <label className="text-xs text-muted-foreground">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1 text-xs" />
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
        <div className="bg-primary-foreground rounded-lg p-4 elevation-1">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-semibold text-primary">₱{totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-2">Period: all-time</div>
        </div>

        <div className="bg-primary-foreground rounded-lg p-4 elevation-1">
          <div className="text-sm text-muted-foreground">Total Orders</div>
          <div className="text-2xl font-semibold text-primary">{totalOrders}</div>
          <div className="text-xs text-muted-foreground mt-2">Avg: ₱{avgOrderValue.toFixed(2)} / order</div>
        </div>

        <div className="bg-primary-foreground rounded-lg p-4 elevation-1">
          <div className="text-sm text-muted-foreground">Total Expenses</div>
          <div className="text-2xl font-semibold text-primary">₱{totalExpenses.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-2">Includes recorded purchases</div>
        </div>

        <div className="bg-primary-foreground rounded-lg p-4 elevation-1">
          <div className="text-sm text-muted-foreground">Estimated Profit</div>
          <div className="text-2xl font-semibold text-primary">{profit >= 0 ? "₱" + profit.toFixed(2) : "- ₱" + Math.abs(profit).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-2">Revenue − Expenses</div>
        </div>
      </section>

      {/* Charts area */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-primary-foreground rounded-lg p-4 elevation-1">

          {revenueByDay.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No revenue data yet</div>
          ) : (
            <RevenueLineChart data={revenueByDay} />
          )}
        </div>

        <div className="bg-primary-foreground rounded-lg p-4 elevation-1">

          {ordersByDay.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No orders yet</div>
          ) : (
            <SalesBarChart data={ordersByDay} />
          )}
        </div>

        <div className="bg-primary-foreground rounded-lg p-4 elevation-1 lg:col-span-2">
 
          {topItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No items sold yet</div>
          ) : (
            <TopItemsPie data={topItems.slice(0, 8)} />
          )}
        </div>
      </section>

      {/* small notes */}
      <section>
        <div className="text-sm text-muted-foreground">
          Notes: Revenue is derived from order.total. Expenses are taken from recorded purchases. Profit shown is a simple Revenue − Expenses snapshot; if you want per-order cost-of-goods or inventory-consumption-based margins we can compute that next by mapping expense items to used quantities.
        </div>
      </section>
    </div>
  )
}