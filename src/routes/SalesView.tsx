"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getExpenses } from "../database/expenses-helper/ExpensesDexieDB"
import { getOrders } from "../database/order-helper/OrderDexieDB"
import {
  RevenueLineChart,
  SalesBarChart,
  TopItemsPie,
} from "../components/sales-system/SalesDetails"

type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type Order = {
  id: string
  tableNumber: string
  items: OrderItem[]
  notes: string
  status: "pending" | "served" | "payment"
  createdAt: string
  subtotal: number
  tax: number
  total: number
  paymentRecords?: Array<{ id: string; method: string; amount: number; createdAt: string }>
}

type Expense = {
  id: string
  item: string
  quantity: number
  unit: string
  unitWeight?: string
  cost: number
  supplier?: string
  date: string
  notes?: string
}

export default function SalesView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [o, ex] = await Promise.all([getOrders(), getExpenses()])
        if (!mounted) return
        setOrders(o)
        setExpenses(ex)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // KPIs
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + (Number(o.total) || 0), 0), [orders])
  const totalOrders = orders.length
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (Number(e.cost) || 0), 0), [expenses])
  const profit = totalRevenue - totalExpenses

  // Sales over time (grouped by day)
  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      const d = new Date(o.createdAt).toISOString().slice(0, 10) // YYYY-MM-DD
      map.set(d, (map.get(d) || 0) + (Number(o.total) || 0))
    }
    const arr = Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return arr
  }, [orders])

  // Orders count by day
  const ordersByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      const d = new Date(o.createdAt).toISOString().slice(0, 10)
      map.set(d, (map.get(d) || 0) + 1)
    }
    const arr = Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return arr
  }, [orders])

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
      <header className="flex justify-between items-center mb-[16px] bg-[#ffffff] rounded-xl p-4 shadow-sm elevation-1 ">
        <h1 className="text-2xl font-bold text-[#266489]">Dashboard</h1>
        <div className="text-sm text-[#72787e]">Overview of sales, revenue and expenses</div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
        <div className="bg-white rounded-lg p-4 elevation-1">
          <div className="text-sm text-[#72787e]">Total Revenue</div>
          <div className="text-2xl font-semibold text-[#41474d]">₱{totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-2">Period: all-time</div>
        </div>

        <div className="bg-white rounded-lg p-4 elevation-1">
          <div className="text-sm text-[#72787e]">Total Orders</div>
          <div className="text-2xl font-semibold text-[#41474d]">{totalOrders}</div>
          <div className="text-xs text-[#72787e] mt-2">Avg: ₱{avgOrderValue.toFixed(2)} / order</div>
        </div>

        <div className="bg-white rounded-lg p-4 elevation-1">
          <div className="text-sm text-[#72787e]">Total Expenses</div>
          <div className="text-2xl font-semibold text-[#266489]">₱{totalExpenses.toFixed(2)}</div>
          <div className="text-xs text-[#72787e] mt-2">Includes recorded purchases</div>
        </div>

        <div className="bg-white rounded-lg p-4 elevation-1">
          <div className="text-sm text-[#72787e]">Estimated Profit</div>
          <div className="text-2xl font-semibold text-[#41474d]">{profit >= 0 ? "₱" + profit.toFixed(2) : "- ₱" + Math.abs(profit).toFixed(2)}</div>
          <div className="text-xs text-[#72787e] mt-2">Revenue − Expenses</div>
        </div>
      </section>

      {/* Charts area */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 elevation-1">
          <h3 className="text-lg font-semibold mb-2 text-[#41474d]">Revenue (by day)</h3>
          {revenueByDay.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No revenue data yet</div>
          ) : (
            <RevenueLineChart data={revenueByDay} />
          )}
        </div>

        <div className="bg-white rounded-lg p-4 elevation-1">
          <h3 className="text-lg font-semibold mb-2 text-[#41474d]">Orders (by day)</h3>
          {ordersByDay.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No orders yet</div>
          ) : (
            <SalesBarChart data={ordersByDay} />
          )}
        </div>

        <div className="bg-white rounded-lg p-4 elevation-1 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-2 text-[#41474d]">Top Sold Items</h3>
          {topItems.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No items sold yet</div>
          ) : (
            <TopItemsPie data={topItems.slice(0, 8)} />
          )}
        </div>
      </section>

      {/* small notes */}
      <section>
        <div className="text-sm text-[#72787e]">
          Notes: Revenue is derived from order.total. Expenses are taken from recorded purchases. Profit shown is a simple Revenue − Expenses snapshot; if you want per-order cost-of-goods or inventory-consumption-based margins we can compute that next by mapping expense items to used quantities.
        </div>
      </section>
    </div>
  )
}