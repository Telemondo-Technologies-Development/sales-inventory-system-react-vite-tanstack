import React, { useEffect, useRef, useState } from "react"
import { Plus, Minus, Send } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import AddMenuModal from "@/components/menu-items/AddMenu"
import UpdateMenuModal from "@/components/menu-items/UpdateMenu"
import {
  addMenuItem,
  getAllMenuItems,
  type MenuItem as DBMenuItem,
} from "@/database/menu-helper/MenuDexieDB"
import { addOrder } from "@/database/order-helper/OrderDexieDB"
import type { OrderItem } from "@/database/order-helper/OrderDexieDB"

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

/* Form validation */
const OrderFormSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  notes: z.string().optional(),
})
type OrderFormValues = z.infer<typeof OrderFormSchema>

/**
 * UI-specific type (presentation shape).
 * DBMenuItem (imported above) is the storage shape (includes Blob image, createdAt).
 * We keep a separate UI type for object URL usage.
 */
type MenuItemForUI = {
  id: string
  name: string
  price: number
  category: string
  imageUrl?: string | undefined
}

export default function TableOrderView() {
  const [menuItems, setMenuItems] = useState<MenuItemForUI[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<OrderItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const objectUrlRefs = useRef<Record<string, string | undefined>>({}) // track created object URLs to revoke

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: { tableNumber: "", notes: "" },
  })

  /* ----- Load menu from DB ----- */
  async function loadMenu() {
    // revoke previous object URLs first
    Object.values(objectUrlRefs.current).forEach((url) => {
      if (url) {
        try {
          URL.revokeObjectURL(url)
        } catch {}
      }
    })
    objectUrlRefs.current = {}

    // items are DBMenuItem (storage shape)
    const items: DBMenuItem[] = await getAllMenuItems()
    const uiItems: MenuItemForUI[] = items.map((it) => {
      let imageUrl: string | undefined
      if (it.image) {
        try {
          imageUrl = URL.createObjectURL(it.image)
          objectUrlRefs.current[it.id] = imageUrl
        } catch {
          imageUrl = undefined
        }
      }
      return {
        id: it.id,
        name: it.name,
        price: it.price,
        category: it.category,
        imageUrl,
      }
    })
    setMenuItems(uiItems)
  }

  useEffect(() => {
    loadMenu()
    return () => {
      // revoke on unmount
      Object.values(objectUrlRefs.current).forEach((url) => {
        if (url) {
          try {
            URL.revokeObjectURL(url)
          } catch {}
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ----- Cart operations ----- */
  const addToCart = (item: MenuItemForUI) => {
    setCartItems((prev) => {
      const existing = prev.find((p) => p.id === item.id)
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p))
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((p) => p.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      setCartItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)))
    }
  }

  const subtotal = cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const tax = subtotal * 0.12
  const total = subtotal + tax

  /* ----- Order submit ----- */
  const onSubmit = async (values: OrderFormValues) => {
    if (cartItems.length === 0) {
      form.setError("tableNumber", { type: "custom", message: "Add items to the order first" })
      return
    }
    const order = {
      id: `ORD-${Date.now()}`,
      tableNumber: values.tableNumber,
      items: cartItems,
      notes: values.notes || "",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      subtotal,
      tax,
      total,
    }

    // optimistic UI event
    window.dispatchEvent(
      new CustomEvent("orders-updated", { detail: { action: "add", order, optimistic: true } })
    )

    try {
      await addOrder(order)
      window.dispatchEvent(
        new CustomEvent("orders-updated", { detail: { action: "confirm", orderId: order.id } })
      )
      // clear
      setCartItems([])
      form.reset()
      alert("Order submitted successfully!")
    } catch (err) {
      console.error("Failed to save order", err)
      form.setError("tableNumber", { type: "server", message: "Failed to submit order. Try again." })
    }
  }

  function openEdit(itemId?: string) {
    setEditingItemId(itemId ?? null)
    setEditOpen(true)
  }
  function closeEdit() {
    setEditingItemId(null)
    setEditOpen(false)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header (page-level) */}
        <div className="flex flex-col  items-start mb-4 bg-primary-foreground rounded-2xl p-2 shadow-sm elevation-1">
          <h1 className="text-3xl font-medium text-primary">Menu</h1>
          <p className="text-sm text-foreground">Overview of dishes and pricing</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          {/* Menu Section */}
          <div>
            <div className="elevation-1 bg-primary-foreground rounded-2xl p-6">
              {/* sub-header inside the menu container with Add button top-right */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary">All dishes</h2>
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={() => setModalOpen(true)}>
                    Add Menu
                  </Button>
                  <Button variant="primary" onClick={() => openEdit()}>
                    Edit Menu
                  </Button>
                </div>
              </div>

              {/* categories */}
              {Array.from(new Set(menuItems.map((m) => m.category))).map((category) => {
                const categoryItems = menuItems.filter((m) => m.category === category)
                return (
                  <div key={category} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-primary">{category}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categoryItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className="elevation-1 bg-card border border-border rounded-2xl p-4 hover:elevation-2 hover:border-primary transition-all group text-left"
                        >
                          <div className="w-full h-36 mb-3 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-sm text-muted-foreground">No image</div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-secondary text-sm">{item.name}</p>
                            <p className="text-primary font-bold mt-2">₱{item.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary Section */}
          <aside className="elevation-1 bg-primary-foreground rounded-2xl p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold text-primary mb-4">Order Summary</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tableNumber"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Table Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., T-1, T-2" />
                      </FormControl>
                      {fieldState.error && <p className="text-xs text-error mt-1">{fieldState.error.message}</p>}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Any special requests?" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="mt-4 mb-4 max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">
                  {cartItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No items added</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center mb-3 pb-3 border-b border-border last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-secondary text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₱{item.price} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded hover:bg-primary-subtle"
                            aria-label={`Decrease ${item.name}`}
                            type="button"
                          >
                            <Minus className="w-4 h-4 text-primary" />
                          </button>
                          <span className="w-6 text-center text-sm text-muted-foreground font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded hover:bg-primary-subtle"
                            aria-label={`Increase ${item.name}`}
                            type="button"
                          >
                            <Plus className="w-4 h-4 text-primary" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 mb-4 p-3 bg-muted/20 rounded-2xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold text-card-foreground">₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (15%):</span>
                    <span className="font-semibold text-card-foreground">₱{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span className="text-primary">Total:</span>
                    <span className="text-primary">₱{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setCartItems([]); form.reset(); }}>
                    Clear
                  </Button>
                  <Button type="submit" variant="primary" size="lg" className="ml-auto" disabled={cartItems.length === 0}>
                    <Send className="w-5 h-5" />
                    Submit Order
                  </Button>
                </div>
              </form>
            </Form>
          </aside>
        </div>
      </div>

      {/* Menu Modals */}
      <AddMenuModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          await loadMenu()
        }}
      />

      <UpdateMenuModal
        open={editOpen}
        onClose={() => closeEdit()}
        onSaved={async () => {
          await loadMenu() // reload after save/delete
          closeEdit()
        }}
      />
    </div>
  )
}