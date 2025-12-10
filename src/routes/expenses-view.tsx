
import React, { useEffect, useMemo, useState } from "react"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { getExpenses, deleteExpense } from "../database/expenses-helper/ExpensesDexieDB"
import { getIngredients } from "../database/inventory-helper/InventoryDexieDB"
import ExpenseFormModal from "../components/expenses-system/ExpensesDetails"
import type { Expense } from "../database/expenses-helper/ExpensesDexieDB"

export default function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [supplierFilter, setSupplierFilter] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const rows = await getExpenses()
      setExpenses(rows as Expense[])
    } catch (err) {
      console.error("Failed to load expenses", err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const suppliers = useMemo(() => {
    const setSup = new Set<string>()
    expenses.forEach((e) => {
      if (e.supplier) setSup.add(e.supplier)
    })
    return Array.from(setSup).sort()
  }, [expenses])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return expenses.filter((e) => {
      if (supplierFilter && e.supplier !== supplierFilter) return false
      if (q && !`${e.item} ${e.supplier ?? ""} ${e.notes ?? ""}`.toLowerCase().includes(q)) return false
      if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false
      if (dateTo && new Date(e.date) > new Date(dateTo)) return false
      return true
    })
  }, [expenses, query, supplierFilter, dateFrom, dateTo])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense? This cannot be undone.")) return
    const prev = expenses
    setExpenses((p) => p.filter((x) => x.id !== id))
    try {
      await deleteExpense(id)
    } catch (err) {
      console.error("Failed to delete expense", err)
      setExpenses(prev)
      alert("Failed to delete expense")
    }
  }

  const handleSaved = async (expense: Expense) => {
    await load()
    await refreshIngredients()
  }

  const refreshIngredients = async () => {
    try {
      await getIngredients()
    } catch {}
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-[16px] bg-primary-foreground rounded-xl p-2 shadow-sm elevation-1 ">

        <div>
          <h1 className="text-2xl font-medium text-primary">Expenses Management</h1>
        <p className="text-sm text-foreground">Overview of costs and expenditures</p>
        </div>
        
        


        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              placeholder="Search item, supplier, notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-3 py-2 elevation-1 rounded-2xl w-80 focus:ring-2 focus:ring-primary/30 text-on-primary-container bg-primary-foreground"
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 elevation-1 rounded-2xl bg-primary-foreground text-on-primary-container focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 elevation-1 rounded-2xl text-on-primary-container bg-primary-foreground" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 elevation-1 rounded-2xl text-on-primary-container bg-primary-foreground" />

          <button
            onClick={() => {
              setEditing(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2xl hover:bg-secondary transition"
          >
            <Plus className="w-4 h-4" /> New Expense
          </button>
        </div>
      </div>

      <div className="bg-primary-foreground rounded-2xl elevation-1 overflow-hidden">
        {/* table wrapper gives a viewport with scroll; header will be sticky */}
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Date</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Item</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Qty</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Unit</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Cost (₱)</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Supplier</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">Notes</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b border-gray-200">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-b last:border-b-0 border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-4 py-4 text-gray-700">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-gray-800">{e.item}</td>
                    <td className="px-4 py-4 text-gray-700">{e.quantity}</td>
                    <td className="px-4 py-4 text-gray-700">{e.unit}{e.unitWeight ? ` · ${e.unitWeight}` : ""}</td>
                    <td className="px-4 py-4 text-gray-700">₱{Number(e.cost).toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-700">{e.supplier ?? "-"}</td>
                    <td className="px-4 py-4 text-gray-700 truncate max-w-[280px]">{e.notes ?? "-"}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex gap-[70px]">
                        <button
                          onClick={() => {
                            setEditing(e)
                            setShowModal(true)
                          }}
                          className="px-3 py-1 bg-primary-foreground border rounded text-sm text-secondary hover:shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="px-3 py-1 bg-white border rounded text-sm text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal
        open={showModal}
        initial={editing ?? undefined}
        onClose={() => {
          setShowModal(false)
          setEditing(null)
        }}
        onSaved={async (expense) => {
          await handleSaved(expense)
          setShowModal(false)
          setEditing(null)
        }}
      />
    </div>
  )
}