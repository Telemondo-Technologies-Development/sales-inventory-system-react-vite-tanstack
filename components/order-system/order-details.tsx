import React, { useEffect, useState } from "react"
import { X, Trash2 } from "lucide-react"

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface PaymentRecord {
  id: string
  method: "Cash" | "Card" | "Online"
  amount: number
  reference?: string
  createdAt: string
}

export interface Order {
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
  const [draft, setDraft] = useState<Order>(structuredClone(order))
  // add-item form
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState<number>(0)
  const [newQty, setNewQty] = useState<number>(1)

  // payment form
  const [payMethod, setPayMethod] = useState<PaymentRecord["method"]>("Cash")
  const [payAmount, setPayAmount] = useState<number>(draft.total)
  const [payRef, setPayRef] = useState<string>("")

  useEffect(() => {
    setDraft(structuredClone(order))
    setPayAmount(order.total)
    setPayMethod("Cash")
    setPayRef("")
    setNewName("")
    setNewPrice(0)
    setNewQty(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])

  const recalcTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0)
    const tax = +(subtotal * 0.15).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { subtotal, tax, total }
  }

  const handleAddItem = () => {
    if (!newName || newPrice <= 0 || newQty <= 0) {
      alert("Please provide valid item name, price and quantity.")
      return
    }
    const newItem: OrderItem = {
      id: `itm-${Date.now()}`,
      name: newName,
      price: newPrice,
      quantity: newQty,
    }
    const items = [...draft.items, newItem]
    const totals = recalcTotals(items)
    const updated: Order = { ...draft, items, subtotal: totals.subtotal, tax: totals.tax, total: totals.total }
    setDraft(updated)
    // clear add form
    setNewName("")
    setNewPrice(0)
    setNewQty(1)
  }

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

  const handleAddPayment = () => {
    // require reference for Cash or Card
    if ((payMethod === "Cash" || payMethod === "Card") && !payRef.trim()) {
      alert("Reference number is required for Cash and Card payments.")
      return
    }
    if (payAmount <= 0) {
      alert("Payment amount must be greater than zero.")
      return
    }
    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      method: payMethod,
      amount: payAmount,
      reference: payRef.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    onSavePayment(order.id, payment)
    onUpdateStatus(order.id, "payment")
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal panel: centered; inner content scrolls if it overflows */}
      <div className="relative z-10 w-full max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg border border-[#e8e8ec] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#f0f0f3]">
            <div>
              <h2 className="text-lg font-bold text-[#723522]">Order {order.id}</h2>
              <p className="text-sm text-[#6b6b73]">
                Table {order.tableNumber} · {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
              <X />
            </button>
          </div>

          {/* Keep body flexible and scrollable when content is large.
              Do not force modal to full-screen height; let inner area scroll. */}
          <div className="p-6 max-h-[80vh] overflow-auto space-y-4">
            {/* Items editor */}
            <div>
              <h3 className="text-sm font-semibold text-[#5d4037] mb-2">Items</h3>
              <div className="divide-y divide-[#f0f0f3] rounded-md overflow-hidden border border-[#f5f5f7]">
                {draft.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between px-4 py-3 bg-white">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[#333]">{it.name}</div>
                      <div className="text-xs text-[#777]">₱{it.price.toFixed(2)}</div>
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
                      <button
                        onClick={() => handleRemoveItem(it.id)}
                        className="ml-2 p-2 rounded hover:bg-red-50 text-red-600"
                        aria-label={`Remove ${it.name}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item small form */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <input
                  placeholder="Item name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 border rounded col-span-2"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newPrice || ""}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="px-3 py-2 border rounded"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-20 px-3 py-2 border rounded"
                  />
                  <button onClick={handleAddItem} className="px-3 py-2 bg-[#8f4c37] text-white rounded">
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-[#5d4037] mb-2">Notes</h3>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                className="w-full p-3 border rounded"
                rows={3}
              />
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-3 text-sm">
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
                <div className="text-lg font-bold text-[#8f4c37]">₱{draft.total.toFixed(2)}</div>
              </div>
            </div>

            {/* Payments table */}
            <div>
              <h3 className="text-sm font-semibold text-[#5d4037] mb-2">Payments</h3>
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
                        <td colSpan={4} className="px-3 py-4 text-center text-[#6b6b73]">
                          No payments recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment form */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentRecord["method"])}
                  className="px-3 py-2 border rounded"
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Online</option>
                </select>
                <input
                  type="number"
                  value={payAmount || ""}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  placeholder="Amount"
                  className="px-3 py-2 border rounded"
                />
                <input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Reference (required for Cash/Card)"
                  className="px-3 py-2 border rounded"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddPayment} className="px-3 py-2 bg-[#445e91] text-white rounded">
                    Record Payment
                  </button>
                  <button onClick={handleSaveEdits} className="px-3 py-2 bg-[#8f4c37] text-white rounded">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end p-4 border-t border-[#f0f0f3]">
            {draft.status === "pending" && (
              <button
                onClick={() => {
                  onUpdateStatus(draft.id, "served")
                  onClose()
                }}
                className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Mark Served
              </button>
            )}

            {draft.status === "served" && (
              <button
                onClick={() => {
                  onUpdateStatus(draft.id, "payment")
                  onClose()
                }}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Request Payment
              </button>
            )}

            <button
              onClick={() => {
                onDelete(draft.id)
                onClose()
              }}
              className="py-2 px-4 bg-white border border-red-100 text-red-700 rounded-lg hover:bg-red-50 transition"
            >
              Delete
            </button>

            <button onClick={onClose} className="py-2 px-4 bg-white border rounded-lg hover:shadow-sm transition">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}