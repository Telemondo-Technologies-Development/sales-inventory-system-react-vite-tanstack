import React, { useEffect, useState } from "react"
import { X } from "lucide-react"
import { addExpense } from "@/lib/dexie"

export type Expense = {
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

type Props = {
  open: boolean
  onClose: () => void
  onSaved?: (expense: Expense) => void
}

/**
 * ExpenseModal
 * - centered modal, inner content scrolls if long
 * - records an expense to Dexie via addExpense()
 */
export default function ExpenseModal({ open, onClose, onSaved }: Props) {
  const [item, setItem] = useState("")
  const [quantity, setQuantity] = useState<number>(1)
  const [unit, setUnit] = useState<string>("bag")
  const [unitWeight, setUnitWeight] = useState<string>("25kg")
  const [cost, setCost] = useState<number>(0)
  const [supplier, setSupplier] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      // reset defaults when opening
      setItem("")
      setQuantity(1)
      setUnit("bag")
      setUnitWeight("25kg")
      setCost(0)
      setSupplier("")
      setDate(new Date().toISOString().slice(0, 10))
      setNotes("")
      setSaving(false)
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    if (!item.trim()) return alert("Please enter an item description.")
    if (quantity <= 0) return alert("Quantity must be at least 1.")
    if (cost <= 0) return alert("Cost must be greater than zero.")

    const expense: Expense = {
      id: `exp-${Date.now()}`,
      item: item.trim(),
      quantity,
      unit,
      unitWeight: unitWeight.trim() || undefined,
      cost: Number(cost),
      supplier: supplier.trim() || undefined,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    }

    setSaving(true)
    try {
      await addExpense(expense as any) // addExpense expects Expense type from dexie module
      onSaved?.(expense)
      onClose()
    } catch (err) {
      console.error("Failed to save expense", err)
      alert("Failed to save expense. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-lg border border-[#e8e8ec] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Record Expense</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <X />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-auto space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item (description)</label>
              <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Bag of flour 25kg" className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 0))} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="bag" className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit weight</label>
                <input value={unitWeight} onChange={(e) => setUnitWeight(e.target.value)} placeholder="25kg" className="w-full px-3 py-2 border rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Total cost (₱)</label>
                <input type="number" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value || 0))} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Rafsky Trading" className="w-full px-3 py-2 border rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Invoice #, delivery note..." className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t">
            <button onClick={onClose} className="py-2 px-4 bg-white border rounded">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="py-2 px-4 bg-[#8f4c37] text-white rounded">
              {saving ? "Saving…" : "Save Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}