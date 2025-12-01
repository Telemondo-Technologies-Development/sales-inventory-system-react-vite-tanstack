"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Clock, CreditCard, Trash2 } from "lucide-react"

interface Order {
  id: string
  tableNumber: string
  items: Array<{ id: string; name: string; price: number; quantity: number }>
  notes: string
  status: "pending" | "served" | "payment"
  createdAt: string
  subtotal: number
  tax: number
  total: number
}

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "served" | "payment">("all")

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = () => {
    const storedOrders = JSON.parse(localStorage.getItem("orders") || "[]")
    setOrders(storedOrders)
  }

  const updateOrderStatus = (orderId: string, newStatus: "pending" | "served" | "payment") => {
    const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    setOrders(updatedOrders)
    localStorage.setItem("orders", JSON.stringify(updatedOrders))
  }

  const deleteOrder = (orderId: string) => {
    const updatedOrders = orders.filter((order) => order.id !== orderId)
    setOrders(updatedOrders)
    localStorage.setItem("orders", JSON.stringify(updatedOrders))
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  const statusConfig = {
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Order Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(["all", "pending", "served", "payment"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === status
                ? "bg-primary text-primary-foreground elevation-2"
                : "bg-card text-card-foreground border border-border hover:border-primary"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => {
          const config = statusConfig[order.status]
          const StatusIcon = config.icon
          return (
            <div key={order.id} className={`elevation-1 ${config.bg} border-2 ${config.border} rounded-xl p-6`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-bold text-lg text-card-foreground">{order.id}</p>
                </div>
                <StatusIcon className={`w-6 h-6 ${config.color}`} />
              </div>

              <div className="mb-4 pb-4 border-b border-border/30">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Table: {order.tableNumber}</p>
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <p key={item.id} className="text-sm text-card-foreground">
                      {item.name} × {item.quantity} - ₱{(item.price * item.quantity).toFixed(2)}
                    </p>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="mb-4 pb-4 border-b border-border/30">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Notes:</p>
                  <p className="text-sm text-card-foreground italic">{order.notes}</p>
                </div>
              )}

              <div className="mb-4 p-3 bg-background/50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">₱{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-semibold">₱{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total:</span>
                  <span className="text-primary">₱{order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                {order.status === "pending" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "served")}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all text-sm"
                  >
                    Mark Served
                  </button>
                )}
                {order.status === "served" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "payment")}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm"
                  >
                    Request Payment
                  </button>
                )}
              </div>

              <button
                onClick={() => deleteOrder(order.id)}
                className="w-full py-2 bg-destructive/10 text-destructive rounded-lg font-semibold hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="elevation-1 bg-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No orders found</p>
        </div>
      )}
    </div>
  )
}
