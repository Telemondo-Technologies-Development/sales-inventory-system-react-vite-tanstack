"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, Clock, CreditCard, Trash2, X } from "lucide-react"
import {
  getOrders,
  seedFromLocalStorageIfEmpty,
  updateOrderStatus as dbUpdateOrderStatus,
  deleteOrder as dbDeleteOrder,
  updateOrder as dbUpdateOrder,
  addPaymentRecord as dbAddPaymentRecord,
} from "@/lib/dexie"

import OrderDetailsModal from "../../components/order-system/order-details"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface PaymentRecord {
  id: string
  method: "Cash" | "Card" | "Online"
  amount: number
  reference?: string
  createdAt: string
}

interface Order {
  id: string
  tableNumber: string
  items: OrderItem[]
  notes: string
  status: "pending" | "served" | "payment"
  createdAt: string
  subtotal: number
  tax: number
  total: number
  paymentRecords?: PaymentRecord[]
}

/* ---------- OrdersView component (Dexie + optimistic UI + payments & edit items) ---------- */
export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([])
  // default to "pending" view; removed "all"
  const [filter, setFilter] = useState<"pending" | "served" | "payment">("pending")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null) // for "See Details" modal

  const loadOrders = useCallback(async () => {
    try {
      const rows = await getOrders()
      setOrders(rows)
    } catch (err) {
      console.error("Failed to load orders from DB", err)
      setOrders([])
    }
  }, [])

  useEffect(() => {
    // seed from localStorage once (dev migration helper)
    seedFromLocalStorageIfEmpty().then(loadOrders)

    // Subscribe to optimistic events dispatched by other components (e.g., TabletOrderInterface)
    const onOrdersUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail) return

      const { action } = detail

      if (action === "add" && detail.optimistic && detail.order) {
        // Optimistically add the order locally immediately (no DB read)
        setOrders((prev) => [detail.order, ...prev])
        return
      }

      if (action === "confirm") {
        // a write succeeded; reload authoritative state from DB
        loadOrders()
        return
      }

      if (action === "rollback" && detail.orderId) {
        // remove the optimistic order (roll back)
        setOrders((prev) => prev.filter((o) => o.id !== detail.orderId))
        return
      }

      // fallback: reload
      loadOrders()
    }

    window.addEventListener("orders-updated", onOrdersUpdated as EventListener)

    // also listen to storage events (other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "orders") loadOrders()
    }
    window.addEventListener("storage", onStorage)

    // initial load
    loadOrders()

    return () => {
      window.removeEventListener("orders-updated", onOrdersUpdated as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [loadOrders])

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    const prev = orders
    setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))

    try {
      await dbUpdateOrderStatus(orderId, newStatus)
      window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "confirm", orderId } }))
    } catch (err) {
      console.error("Failed to update order status:", err)
      setOrders(prev)
      alert("Failed to update order status. Please try again.")
    }
  }

  const deleteOrder = async (orderId: string) => {
    const prev = orders
    setOrders((prevOrders) => prevOrders.filter((o) => o.id !== orderId))

    try {
      await dbDeleteOrder(orderId)
      window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "confirm", orderId } }))
    } catch (err) {
      console.error("Failed to delete order:", err)
      setOrders(prev)
      alert("Failed to delete order. Please try again.")
    }
  }

  /* Update items / notes for an order (optimistic) */
  const saveOrderEdits = async (edited: Order) => {
    const prev = orders
    setOrders((prevOrders) => prevOrders.map((o) => (o.id === edited.id ? edited : o)))

    try {
      await dbUpdateOrder(edited)
      window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "confirm", orderId: edited.id } }))
    } catch (err) {
      console.error("Failed to save order edits:", err)
      setOrders(prev)
      alert("Failed to save changes. Please try again.")
    }
  }

  /* Add a payment record for the order (optimistic) */
  const savePayment = async (orderId: string, payment: PaymentRecord) => {
    const prev = orders
    // optimistic: add payment locally
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, paymentRecords: [...(o.paymentRecords || []), payment] } : o)),
    )

    try {
      await dbAddPaymentRecord(orderId, payment)
      window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "confirm", orderId } }))
    } catch (err) {
      console.error("Failed to add payment:", err)
      setOrders(prev)
      alert("Failed to record payment. Please try again.")
    }
  }

  // filter only by exact status (no "all")
  const filteredOrders = orders.filter((o) => o.status === filter)

  const statusConfig: Record<
    "pending" | "served" | "payment",
    { label: string; icon: any; color: string; bg: string; border: string }
  > = {
    pending: {
      label: "Pending",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    served: {
      label: "Order Served",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    payment: {
      label: "Payment",
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
  }

  // helper to compute paid and balance
  const paidAmount = (o: Order) => (o.paymentRecords || []).reduce((s, p) => s + (p.amount || 0), 0)
  const balanceAmount = (o: Order) => +(o.total - paidAmount(o))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-[16px] bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <h1 className="text-3xl font-bold text-[#266489]">Order Management</h1>
      </div>

      {/* Navigation (semantic) - only Pending, Served, Payment */}
      <nav aria-label="Order sections" className="mb-6">
        <ul className="flex flex-wrap gap-3">
          {(["pending", "served", "payment"] as const).map((status) => (
            <li key={status}>
              <button
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                  filter === status
                    ? "bg-[#266489] text-white shadow-sm"
                    : "bg-white text-[#266489] elevation-1 hover:border-[#266489]"
                }`}
                aria-pressed={filter === status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content by section:
          - pending & served: grid of cards (compact)
          - payment: table view (compact rows, shows payments / balance)
      */}
      {filter === "payment" ? (
        // Payment table view (compact)
        <section aria-labelledby="payments-heading">
          <h2 id="payments-heading" className="sr-only">Payment Orders</h2>
          <div className="overflow-x-auto bg-white rounded-xl elevation-1 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa]">
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Table</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2 text-left">Paid</th>
                  <th className="px-3 py-2 text-left">Balance</th>
                  <th className="px-3 py-2 text-left">Last Payment</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const paid = paidAmount(o)
                  const balance = balanceAmount(o)
                  const lastPayment = (o.paymentRecords || []).slice(-1)[0]
                  return (
                    <tr key={o.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{o.id}</td>
                      <td className="px-3 py-2">{o.tableNumber}</td>
                      <td className="px-3 py-2">₱{o.total.toFixed(2)}</td>
                      <td className="px-3 py-2">₱{paid.toFixed(2)}</td>
                      <td className="px-3 py-2">₱{balance.toFixed(2)}</td>
                      <td className="px-3 py-2">{lastPayment ? new Date(lastPayment.createdAt).toLocaleString() : "-"}</td>
                      <td className="px-3 py-2">{o.status}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-2 py-1 bg-white border border-[#e6e6e9] rounded text-sm hover:shadow-sm"
                            title="See details"
                          >
                            See
                          </button>
                          <button
                            onClick={() => deleteOrder(o.id)}
                            className="px-2 py-1 bg-white border border-red-100 text-red-700 rounded text-sm hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-[#6b6b73]">
                      No payment orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        // Grid view for pending/served
        <section aria-labelledby="orders-heading">
          <h2 id="orders-heading" className="sr-only">Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status]
              const StatusIcon = config.icon
              return (
                <article
                  key={order.id}
                  className={`flex flex-col h-full rounded-xl p-5 border border-[#e8e8ec] bg-white shadow-sm`}
                >
                  <header className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#50606e]">Order ID</p>
                      <p className="font-bold text-lg text-[#266489]">{order.id}</p>
                      <p className="text-sm text-[#50606e] mt-1">
                        Table: <span className="font-semibold">{order.tableNumber}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusIcon className={`w-7 h-7 ${config.color}`} />
                    </div>
                  </header>

                  <section className="text-sm text-[#333] mb-4 flex-1">
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id + item.name} className="flex justify-between">
                          <span className="truncate">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && <div className="text-xs text-[#6b6b73] mt-2">+{order.items.length - 3} more item(s)</div>}
                    </div>
                  </section>

                  {/* totals block */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-[#6b6b73]">
                      <span>Subtotal</span>
                      <span>₱{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#6b6b73]">
                      <span>Tax</span>
                      <span>₱{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#f0f0f3] text-[#266489]">
                      <span>Total</span>
                      <span className="text-[#50606e]">₱{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* footer actions */}
                  <footer className="mt-auto flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2 flex-1">
                      {order.status === "pending" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "served")}
                          className="flex-1 py-2 bg-[#266489] text-white rounded-lg font-semibold hover:bg-[#50606e] transition text-sm"
                        >
                          Mark Served
                        </button>
                      )}
                      {order.status === "served" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "payment")}
                          className="flex-1 py-2 bg-[#004b6f] text-white rounded-lg font-semibold hover:bg-[#384956] transition text-sm"
                        >
                          Request Payment
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="py-2 px-3 bg-white border border-[#e6e6e9] rounded-lg text-[#5d4037] hover:shadow-sm transition text-sm"
                      >
                        See Details
                      </button>
                    </div>

                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="py-2 px-3 bg-white border border-red-100 text-red-700 rounded-lg hover:bg-red-50 transition text-sm"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </footer>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSaveEdits={saveOrderEdits}
          onSavePayment={savePayment}
          onUpdateStatus={updateOrderStatus}
          onDelete={deleteOrder}
        />
      )}
    </div>
  )
}