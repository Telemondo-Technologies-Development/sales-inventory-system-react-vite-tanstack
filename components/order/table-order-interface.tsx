"use client"

import { useState } from "react"
import { Plus, Minus, LogOut, Send } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  image: string
}

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function TabletOrderInterface() {
  const [menuItems] = useState<MenuItem[]>([
    { id: "1", name: "Burger", price: 120, category: "Main", image: "/classic-beef-burger.png" },
    { id: "2", name: "Pizza", price: 180, category: "Main", image: "/delicious-pizza.png" },
    { id: "3", name: "Fries", price: 80, category: "Sides", image: "/golden-crispy-fries.png" },
    { id: "4", name: "Soda", price: 50, category: "Drinks", image: "/assorted-soda-cans.png" },
    { id: "5", name: "Ice Cream", price: 60, category: "Desserts", image: "/colorful-ice-cream-cones.png" },
    { id: "6", name: "Salad", price: 100, category: "Main", image: "/vibrant-mixed-salad.png" },
  ])

  const [cartItems, setCartItems] = useState<OrderItem[]>([])
  const [tableName, setTableName] = useState("")
  const [notes, setNotes] = useState("")
  const navigate = useNavigate()


  const categories = ["Main", "Sides", "Drinks", "Desserts"]

  const addToCart = (item: MenuItem) => {
    const existing = cartItems.find((ci) => ci.id === item.id)
    if (existing) {
      setCartItems(cartItems.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci)))
    } else {
      setCartItems([...cartItems, { id: item.id, name: item.name, price: item.price, quantity: 1 }])
    }
  }

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((ci) => ci.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      setCartItems(cartItems.map((ci) => (ci.id === id ? { ...ci, quantity } : ci)))
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.15
  const total = subtotal + tax

  const handleSubmitOrder = () => {
    if (!tableName || cartItems.length === 0) {
      alert("Please select a table and add items to order")
      return
    }

    const order = {
      id: `ORD-${Date.now()}`,
      tableNumber: tableName,
      items: cartItems,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
      subtotal,
      tax,
      total,
    }

    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    orders.push(order)
    localStorage.setItem("orders", JSON.stringify(orders))

    alert("Order submitted successfully!")
    setCartItems([])
    setTableName("")
    setNotes("")
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    navigate({ to: "/" })
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">New Order</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="elevation-1 bg-card rounded-2xl p-6">
              {categories.map((category) => {
                const categoryItems = menuItems.filter((m) => m.category === category)
                return (
                  <div key={category} className="mb-8">
                    <h2 className="text-lg font-semibold text-card-foreground mb-4 text-primary">{category}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categoryItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="elevation-1 bg-card border border-border rounded-xl p-4 hover:elevation-2 hover:border-primary transition-all group"
                        >
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-24 object-cover rounded-lg mb-3"
                          />
                          <p className="font-semibold text-card-foreground text-sm">{item.name}</p>
                          <p className="text-primary font-bold mt-2">₱{item.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="elevation-1 bg-card rounded-2xl p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Order Summary</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">Table Number</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., T-1, T-2"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mb-4 max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">No items added</p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center mb-3 pb-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₱{item.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded hover:bg-primary/10"
                      >
                        <Minus className="w-4 h-4 text-primary" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">Special Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2 mb-4 p-3 bg-muted/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-card-foreground">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (15%):</span>
                <span className="font-semibold text-card-foreground">₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-card-foreground">Total:</span>
                <span className="text-primary">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={cartItems.length === 0 || !tableName}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all elevation-1 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
