import { useEffect, useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { getExpenses, deleteExpense } from "@/database/expenses-helper/ExpensesDexieDB"
import { getIngredients } from "@/database/inventory-helper/InventoryDexieDB"
import ExpenseFormModal from "@/components/expenses-system/ExpensesDetails"
import type { Expense } from "@/database/expenses-helper/ExpensesDexieDB"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [supplierFilter, setSupplierFilter] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  const handleSaved = async () => {
    await load()
    await refreshIngredients()
  }

  const refreshIngredients = async () => {
    try {
      await getIngredients()
    } catch {}
  }

  const ALL_SUPPLIERS_VALUE = "__all__"

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 rounded-2xl bg-primary-foreground p-4 elevation-1">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="w-full lg:w-[400px]">
            <h1 className="text-2xl font-medium text-primary">Expenses Management</h1>
            <p className="text-sm text-foreground">Overview of costs and expenditures</p>
          </div>

          {/* Tablet/Mobile: single column. Desktop: inline controls */}
          <div className="grid grid-cols-1 gap-3 w-full lg:flex lg:flex-wrap lg:items-center lg:justify-end">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search item, supplier, notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Select
                value={supplierFilter || ALL_SUPPLIERS_VALUE}
                onValueChange={(v) => setSupplierFilter(v === ALL_SUPPLIERS_VALUE ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SUPPLIERS_VALUE}>All suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full" />
            </div>
            <div>
              <Button
                  variant="primary"
                  onClick={() => {
                    setEditing(null)
                    setShowModal(true)
                  }}
                  className="w-full lg:w-auto"
                >
                <Plus className="w-4 h-4" /> New Expense
              </Button>
            </div>
          </div>
        </header>
      </div>

      <div className="bg-primary-foreground rounded-2xl elevation-1 overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          {/* Tablet/Mobile: grid rows with View more */}
          <div className="lg:hidden">
            <div className="sticky top-0 z-20 grid grid-cols-5  gap-1 bg-muted/60 px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-border text-start">
              <div className="">Item</div>
              <div className="">Quantity</div>
              <div className="">Unit</div>
              <div className="">Cost</div>
              <div className="">View</div>
            </div>

            {loading ? (
              <div className="px-4 py-12 text-center text-gray-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">No expenses found</div>
            ) : (
              filtered.map((e) => {
                const isExpanded = expandedId === e.id
                return (
                  <div key={e.id} className="border-b last:border-b-0 border-border">
                    <div className="grid grid-cols-5 items-center justify-center gap-1 px-4 py-3 text-xs">
                      <div className=" text-foreground">{e.item}</div>
                      <div className=" text-foreground">{e.quantity}</div>
                      <div className=" text-foreground">{e.unit}</div>
                      <div className=" text-foreground">₱{Number(e.cost).toFixed(2)}</div>
                      <div className="">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setExpandedId((prev) => (prev === e.id ? null : e.id))}
                        >
                          {isExpanded ? "Hide" : "More"}
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-background/40 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Date</span>
                            <span className="text-foreground">{new Date(e.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Supplier</span>
                            <span className="text-foreground">{e.supplier ?? "-"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Unit detail</span>
                            <span className="text-foreground">{e.unitWeight ? `${e.unitWeight}` : "-"}</span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-muted-foreground">Notes</span>
                            <span className="text-foreground text-right wrap-break-word">{e.notes ?? "-"}</span>
                          </div>

                          <div className="flex pt-1">
                            <Button
                              onClick={() => {
                                setEditing(e)
                                setShowModal(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(e.id)}
                              variant="danger"
                              size="sm"
                              className="flex-1"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: full table */}
          <table className="hidden lg:table w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-muted/60">
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border">Date</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border">Item</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border">Qty</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border">Unit</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border">Cost (₱)</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border hidden md:table-cell">Supplier</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b border-border hidden lg:table-cell">Notes</th>
                <th className="sticky top-0 z-20 px-4 py-3 text-center text-sm font-semibold text-muted-foreground border-b border-border">Action</th>
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
                  <tr key={e.id} className="border-b last:border-b-0 border-border hover:bg-muted/40 transition">
                    <td className="px-4 py-4 text-foreground">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-foreground">{e.item}</td>
                    <td className="px-4 py-4 text-foreground">{e.quantity}</td>
                    <td className="px-4 py-4 text-foreground">
                      {e.unit}
                      {e.unitWeight ? ` · ${e.unitWeight}` : ""}
                    </td>
                    <td className="px-4 py-4 text-foreground">₱{Number(e.cost).toFixed(2)}</td>
                    <td className="px-4 py-4 text-foreground hidden md:table-cell">{e.supplier ?? "-"}</td>
                    <td className="px-4 py-4 text-foreground truncate max-w-[280px] hidden lg:table-cell">{e.notes ?? "-"}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex gap-2">
                        <Button
                          onClick={() => {
                            setEditing(e)
                            setShowModal(true)
                          }}
                          variant="outline"
                          size="icon"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(e.id)}
                          variant="danger"
                          size="icon"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
        onSaved={async () => {
          await handleSaved()
          setShowModal(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

export const Route = createFileRoute("/expenses")({
  component: ExpensesView,
})