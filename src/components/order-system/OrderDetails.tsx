"use client"

import React, { useEffect, useRef, useState } from "react"
import { X, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import type { Order, OrderItem, PaymentRecord } from "../../database/order-helper/OrderDexieDB"

// shadcn UI primitives — adjust if your project uses different paths
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

/**
 * OrderDetails modal converted to use react-hook-form for the small add-item
 * and payment forms while keeping the main "draft" state for item list edits.
 *
 * - Add Item form uses RHF to handle validation/submit for adding a new item.
 * - Payment form uses RHF to validate required reference (for Cash/Card) and amount.
 * - Notes and item quantity edits remain managed in local state (draft).
 * - Accessibility: Escape to close, focus management preserved.
 */
type Props = {
  order: Order
  onClose: () => void
  onSaveEdits: (o: Order) => void
  onSavePayment: (orderId: string, payment: PaymentRecord) => void
  onUpdateStatus: (orderId: string, status: Order["status"]) => void
  onDelete: (orderId: string) => void
}

export default function OrderDetails({
  order,
  onClose,
  onSaveEdits,
  onSavePayment,
  onUpdateStatus,
  onDelete,
}: Props) {
  const cloneOrder = (o: Order) => {
    try {
      // @ts-ignore
      return typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o))
    } catch {
      return JSON.parse(JSON.stringify(o))
    }
  }

  const [draft, setDraft] = useState<Order>(() => cloneOrder(order))

  // focus management
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Reset local draft when order changes
  useEffect(() => {
    setDraft(cloneOrder(order))
  }, [order])

  // focus + basic trap + escape
  useEffect(() => {
    previouslyFocused.current = (document.activeElement as HTMLElement) || null
    closeButtonRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      // keep simple tab trap for modal focus
      if (e.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>
        ).filter((el) => el.offsetParent !== null)
        if (focusable.length > 0) {
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("keydown", handleKey)
      previouslyFocused.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recalcTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0)
    const tax = +(subtotal * 0.15).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { subtotal, tax, total }
  }

  // ---------- Add Item form (RHF) ----------
  type AddItemForm = {
    name: string
    price: number | ""
    quantity: number | ""
  }

  const addItemForm = useForm<AddItemForm>({
    defaultValues: { name: "", price: "", quantity: 1 },
  })

  const onAddItem = (vals: AddItemForm) => {
    const name = String(vals.name || "").trim()
    const price = Number(vals.price || 0)
    const qty = Number(vals.quantity || 0)

    if (!name || price <= 0 || qty <= 0) {
      // Shouldn't hit due to RHF validation but safe-guard
      addItemForm.setError("name", { type: "manual", message: "Provide valid name, price and quantity" })
      return
    }

    const newItem: OrderItem = { id: `itm-${Date.now()}`, name, price, quantity: qty }
    const items = [...draft.items, newItem]
    const totals = recalcTotals(items)
    const updated: Order = { ...draft, items, subtotal: totals.subtotal, tax: totals.tax, total: totals.total }
    setDraft(updated)
    addItemForm.reset()
  }

  // ---------- Payment form (RHF) ----------
  type PaymentForm = {
    method: PaymentRecord["method"]
    amount: number | ""
    reference: string
  }

  const paymentForm = useForm<PaymentForm>({
    defaultValues: { method: "Cash", amount: order.total, reference: "" },
  })

  const paymentRefRequired = (method: PaymentRecord["method"]) => method === "Cash" || method === "Card"

  const onAddPayment = (vals: PaymentForm) => {
    const amount = Number(vals.amount || 0)
    const method = vals.method
    const reference = (vals.reference || "").trim()

    if (amount <= 0) {
      paymentForm.setError("amount", { type: "manual", message: "Amount must be greater than zero" })
      return
    }
    if (paymentRefRequired(method) && !reference) {
      paymentForm.setError("reference", { type: "manual", message: "Reference required for Cash/Card" })
      return
    }

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      method,
      amount,
      reference: reference || undefined,
      createdAt: new Date().toISOString(),
    }

    onSavePayment(order.id, payment)
    onUpdateStatus(order.id, "payment")
    onClose()
  }

  // ---------- Draft/item helpers ----------
  const handleRemoveItem = (id: string) => {
    const items = draft.items.filter((it) => it.id !== id)
    const totals = recalcTotals(items)
    const updated: Order = { ...draft, items, subtotal: totals.subtotal, tax: totals.tax, total: totals.total }
    setDraft(updated)
  }

  const handleChangeQty = (id: string, qty: number) => {
    if (qty <= 0) return
    const items = draft.items.map((it) => (it.id === id ? { ...it, quantity: qty } : it))
    const totals = recalcTotals(items)
    const updated: Order = { ...draft, items, subtotal: totals.subtotal, tax: totals.tax, total: totals.total }
    setDraft(updated)
  }

  const handleSaveEdits = () => {
    onSaveEdits(draft)
    onClose()
  }

  const hasChanges = JSON.stringify(order) !== JSON.stringify(draft)

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="order-details-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 id="order-details-title" className="text-lg font-bold text-[#266489]">Order {order.id}</h2>
              <p className="text-sm text-[#72787e]">Table {order.tableNumber} · {new Date(order.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2">
              <button ref={closeButtonRef} onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
                <X />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[80vh] overflow-auto space-y-6">
            {/* Items editor */}
            <section>
              <h3 className="text-sm font-semibold text-[#266489] mb-2">Items</h3>

              <div className="divide-y divide-[#f0f0f3] rounded-md overflow-hidden">
                {draft.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between px-4 py-3 bg-white">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[#72787e]">{it.name}</div>
                      <div className="text-xs text-[#72787e]">₱{it.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={it.quantity}
                        min={1}
                        onChange={(e) => handleChangeQty(it.id, Number(e.target.value))}
                        className="w-16 px-2 py-1 border rounded text-sm"
                        aria-label={`Quantity for ${it.name}`}
                      />
                      <div className="font-semibold">₱{(it.price * it.quantity).toFixed(2)}</div>
                      <button onClick={() => handleRemoveItem(it.id)} className="ml-2 p-2 rounded hover:bg-red-50 text-[#ba1a1a]" aria-label={`Remove ${it.name}`} title="Remove item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {draft.items.length === 0 && <div className="px-4 py-4 text-sm text-[#6b6b73]">No items</div>}
              </div>

              {/* Add item form (react-hook-form + shadcn primitives) */}
              <div className="mt-4">
                <Form {...addItemForm}>
                  <form onSubmit={addItemForm.handleSubmit(onAddItem)} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <FormField
                      control={addItemForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="sr-only">Item name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Item name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addItemForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Price</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="Price" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <FormField
                        control={addItemForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Quantity</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min={1} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="px-6 py-2 bg-[#266489] text-white">Add</Button>
                    </div>
                  </form>
                </Form>
              </div>
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-[#5d4037] mb-2">Notes</h3>
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} />
            </section>

            {/* Totals */}
            <section className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-[#fafafa] rounded border border-[#f0f0f3]">
                <div className="text-xs text-[#6b6b73]">Subtotal</div>
                <div className="font-semibold">₱{draft.subtotal.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-[#fafafa] rounded border border-[#f0f0f3]">
                <div className="text-xs text-[#6b6b73]">Tax</div>
                <div className="font-semibold">₱{draft.tax.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-white rounded border border-[#f0f0f3]">
                <div className="text-xs text-[#6b6b73]">Total</div>
                <div className="text-lg font-bold text-[#266489]">₱{draft.total.toFixed(2)}</div>
              </div>
            </section>

            {/* Payments */}
            <section>
              <h3 className="text-sm font-semibold text-[#266489] mb-2">Payments</h3>

              <div className="overflow-x-auto rounded border border-[#f5f5f7]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fafafa]">
                      <th className="px-3 py-2 text-left">Method</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Reference</th>
                      <th className="px-3 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(draft.paymentRecords || []).map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2">{p.method}</td>
                        <td className="px-3 py-2">₱{p.amount.toFixed(2)}</td>
                        <td className="px-3 py-2">{p.reference ?? "-"}</td>
                        <td className="px-3 py-2">{new Date(p.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(draft.paymentRecords || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-[#6b6b73]">No payments recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment form */}
              <div className="mt-4">
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onAddPayment)} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <FormField
                      control={paymentForm.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Method</FormLabel>
                          <FormControl>
                            <select {...field} className="px-3 py-2 border rounded-2xl w-full">
                              <option value="Cash">Cash</option>
                              <option value="Card">Card</option>
                              <option value="Online">Online</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Amount</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="Amount" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="reference"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Reference</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Reference (if required)" />
                          </FormControl>
                          {fieldState.error?.message && <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>}
                        </FormItem>
                      )}
                    />

                    <div className="sm:col-span-3 flex gap-3 mt-2">
                      <Button type="submit" className="px-6 py-2 bg-[#266489] text-white" disabled={false}>
                        Record Payment
                      </Button>
                      <Button type="button" className="px-6 py-2 bg-[#64597b] text-white" onClick={handleSaveEdits} disabled={!hasChanges}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </section>
          </div>

          <div className="flex items-center gap-2 justify-end p-4 border-t border-[#f0f0f3]">
            {draft.status === "pending" && (
              <Button
                onClick={() => {
                  onUpdateStatus(draft.id, "served")
                  onClose()
                }}
                className="py-2 px-4 bg-[#266489] text-white rounded-2xl hover:bg-[#50606e] transition"
              >
                Mark Served
              </Button>
            )}

            {draft.status === "served" && (
              <Button
                onClick={() => {
                  onUpdateStatus(draft.id, "payment")
                  onClose()
                }}
                className="py-2 px-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition"
              >
                Request Payment
              </Button>
            )}

            <Button
              onClick={() => {
                onDelete(draft.id)
                onClose()
              }}
              className="py-2 px-4 bg-white border border-red-100 text-red-700 rounded-lg hover:bg-red-50 transition"
            >
              Delete
            </Button>

            <Button onClick={onClose} className="py-2 px-4 bg-white border rounded-lg hover:shadow-sm transition">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}