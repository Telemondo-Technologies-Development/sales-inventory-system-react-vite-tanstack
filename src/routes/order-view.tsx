import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, Clock, CreditCard, Trash2, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getOrders,
  updateOrderStatus as dbUpdateOrderStatus,
  deleteOrder as dbDeleteOrder,
  updateOrder as dbUpdateOrder,
  addPaymentRecord as dbAddPaymentRecord,
} from "../database/order-helper/OrderDexieDB"

import OrderDetailsModal from "../components/order-system/OrderDetails"

import type { Order, PaymentRecord } from "../database/order-helper/OrderDexieDB"

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
    // initial load only; no global event listener
    loadOrders()
  }, [loadOrders])

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    const prev = orders
    setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))

    try {
      await dbUpdateOrderStatus(orderId, newStatus)
      // authoritative state will be reflected when you call loadOrders where needed
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
      // DB changed; reload when needed
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
    { label: string; icon: LucideIcon; color: string; bg: string; border: string }
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col items-start mb-4 bg-primary-foreground rounded-xl p-2 elevation-1 ">
        <h1 className="text-3xl font-medium text-primary">Order Management</h1>
        <p className="text-sm text-muted-foreground">Overview of orders and fulfillment</p>
      </div>

      {/* Navigation (semantic) - only Pending, Served, Payment */}
      <nav aria-label="Order sections" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {(["pending", "served", "payment"] as const).map((status) => (
            <li key={status}>
              <Button
                onClick={() => setFilter(status)}
                size="sm"
                variant={filter === status ? "primary" : "outline"}
                aria-pressed={filter === status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
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
          <div className="overflow-x-auto bg-primary-foreground rounded-2xl elevation-1">
            <table className="w-full text-sm min-w-[680px] sm:min-w-[860px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Order</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Table</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Total</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200 hidden sm:table-cell">Paid</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Balance</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200 hidden md:table-cell">Last Payment</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200 hidden lg:table-cell">Payment Method</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const paid = paidAmount(o)
                  const balance = balanceAmount(o)
                  const lastPayment = (o.paymentRecords || []).slice(-1)[0]

                  return (
                    <tr key={o.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs sm:text-sm max-w-[220px] truncate">{o.id}</td>
                      <td className="px-3 py-2">{o.tableNumber}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        ₱{o.total.toFixed(2)}
                        <div className="sm:hidden text-xs text-muted-foreground">
                          Paid: ₱{paid.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums hidden sm:table-cell">₱{paid.toFixed(2)}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">₱{balance.toFixed(2)}</td>
                      <td className="px-3 py-2 hidden md:table-cell">{lastPayment ? new Date(lastPayment.createdAt).toLocaleString() : "-"}</td>

                      {/* Payment Method column: show last payment method or a clear "No payments yet" statement */}
                      <td className="px-3 py-2 hidden lg:table-cell">
                        {lastPayment ? (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                            <span className="uppercase">{lastPayment.method}</span>
                          </span>
                        ) : (
                          <span className="text-sm italic text-gray-500">No payments yet</span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex gap-2">
                          <Button
                            onClick={() => setSelectedOrder(o)}
                            size="sm"
                            variant="outline"
                            title="See details"
                          >
                            See
                          </Button>
                          <Button
                            onClick={() => deleteOrder(o.id)}
                            size="icon-sm"
                            variant="destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status]
              const StatusIcon = config.icon
              return (
                <article
                  key={order.id}
                  className={`flex flex-col h-full rounded-2xl p-5 border border-[#e8e8ec] bg-primary-foreground elevation-1`}
                >
                  <header className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-bold text-lg text-primary">{order.id}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Table: <span className="font-semibold">{order.tableNumber}</span>
                      </p>
                    </div>
                    <div className="shrink-0">
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
                      {order.items.length > 3 && <div className="text-xs text-muted-foreground mt-2">+{order.items.length - 3} more item(s)</div>}
                    </div>
                  </section>

                  {/* totals block */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₱{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax</span>
                      <span>₱{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-foreground text-primary">
                      <span>Total</span>
                      <span className="text-muted-foreground">₱{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* footer actions */}
                  <footer className="mt-auto flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2 flex-1">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "served")}
                          className="flex-1"
                          variant="primary"
                          size="sm"
                        >
                          Mark Served
                        </Button>
                      )}
                      {order.status === "served" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "payment")}
                          className="flex-1"
                          variant="secondary"
                          size="sm"
                        >
                          Request Payment
                        </Button>
                      )}

                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="outline"
                        size="sm"
                      >
                        See Details
                      </Button>
                    </div>

                    <Button
                      onClick={() => deleteOrder(order.id)}
                      variant="destructive"
                      size="icon-sm"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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