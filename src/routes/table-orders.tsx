import { useState } from "react"
import { Plus, Minus, Send } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { addOrder } from "@/lib/dexie"

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
  const navigate = useNavigate()

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

  const categories = ["Main", "Sides", "Drinks", "Desserts"]

  const addToCart = (item: MenuItem) => {
    const existing = cartItems.find((ci) => ci.id === item.id)
    if (existing) {
      setCartItems((prev) => prev.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci)))
    } else {
      setCartItems((prev) => [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }])
    }
  }

  const removeFromCart = (id: string) => setCartItems((prev) => prev.filter((ci) => ci.id !== id))

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(id)
    else setCartItems((prev) => prev.map((ci) => (ci.id === id ? { ...ci, quantity } : ci)))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.15
  const total = subtotal + tax

  const handleSubmitOrder = async () => {
    if (!tableName || cartItems.length === 0) {
      alert("Please select a table and add items to order")
      return
    }

    // Build order object
    const order = {
      id: `ORD-${Date.now()}`,
      tableNumber: tableName,
      items: cartItems,
      notes,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      subtotal,
      tax,
      total,
    }

    // Optimistic UI: notify other parts of the app immediately
    // detail: { action, order, optimistic }
    window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "add", order, optimistic: true } }))

    try {
      // Persist to Dexie (async)
      await addOrder(order)
      // confirm: let listeners know the write succeeded (they may reload / reconcile)
      window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "confirm", orderId: order.id } }))
    } catch (err) {
      // rollback: tell listeners to remove the optimistic order
      window.dispatchEvent(new CustomEvent("orders-updated", { detail: { action: "rollback", orderId: order.id } }))
      console.error("Failed to save order to DB:", err)
      alert("Failed to submit order. Please try again.")
      return
    }

    // If saved successfully, clear local cart and inputs
    setCartItems([])
    setTableName("")
    setNotes("")
    alert("Order submitted successfully!")
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-[16px] bg-[#ffffff] rounded-xl p-4 shadow-sm elevation-1 ">
          <h1 className="text-3xl font-semibold text-[#266489] ">Menu</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          {/* Menu Section - flexible column (takes remaining width) */}
          <div>
            <div className="elevation-1 bg-[#ffffff] rounded-2xl p-6 ">
              {categories.map((category) => {
                const categoryItems = menuItems.filter((m) => m.category === category)
                return (
                  <div key={category} className="mb-8">
                    <h2 className="text-lg font-semibold  mb-4 text-[#266489]">{category}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categoryItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="elevation-1 bg-card border border-[#c1c7ce] rounded-xl p-4 hover:elevation-2 hover:border-[#50606e] transition-all group text-left"
                        >
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-24 object-cover rounded-lg mb-3"
                          />
                          <div className="flex items-center justify-between">
                            <p className="font-semibold  text-[#50606e] text-sm">{item.name}</p>
                            <p className="text-[#266489] font-bold mt-2">₱{item.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary Section - fixed width column (360px on lg+) */}
          <aside className="elevation-1 bg-[#ffffff] rounded-2xl p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold text-[#266489] mb-4">Order Summary</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#50606e] mb-2">Table Number</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., T-1, T-2"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-[#50606e] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mb-4 max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">
              {cartItems.length === 0 ? (
                <p className="text-[#50606e] text-sm">No items added</p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center mb-3 pb-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#50606e] text-sm">{item.name}</p>
                      <p className="text-xs text-[#50606e]">
                        ₱{item.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded hover:bg-primary/10"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="w-4 h-4 text-[#723522]" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded hover:bg-primary/10"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="w-4 h-4 text-[#723522]" />
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
                <span className="text-[#266489]">Total:</span>
                <span className="text-[#266489]">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={cartItems.length === 0 || !tableName}
              className="w-full py-3 bg-[#266489] text-[#ffffff] font-semibold rounded-lg hover:bg-[#50606e]  transition-all elevation-1 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Submit Order
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}