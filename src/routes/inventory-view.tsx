

import { useEffect, useState } from "react"
import { AlertTriangle, Edit2, Save, X, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import {
  getIngredients,
  updateIngredient as dbUpdateIngredient,
  deleteIngredient as dbDeleteIngredient,
} from "../database/inventory-helper/InventoryDexieDB"

import type { Ingredient } from "../database/inventory-helper/InventoryDexieDB"


export default function InventoryView() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await loadIngredients()
      setLoading(false)
    })()
  }, [])

  const loadIngredients = async () => {
    try {
      const rows = await getIngredients()
      setIngredients(rows)
    } catch (err) {
      console.error("Failed to load ingredients:", err)
      setIngredients([])
    }
  }

  const lowStockItems = ingredients.filter((ing) => ing.quantity <= ing.minThreshold)

  const saveEdit = async () => {
    if (!editingId) return
    const prev = ingredients
    const updated = ingredients.map((ing) =>
      ing.id === editingId ? { ...ing, ...editForm, lastUpdated: new Date().toISOString() } : ing,
    )
    setIngredients(updated as Ingredient[])

    try {
      await dbUpdateIngredient(editingId, { ...(editForm as Partial<Ingredient>) })
      await loadIngredients()
    } catch (err) {
      console.error("Failed to update ingredient:", err)
      setIngredients(prev)
      alert("Failed to save changes. Please try again.")
    } finally {
      setEditingId(null)
      setEditForm({})
    }
  }

  const deleteIng = async (id: string) => {
    if (!confirm("Delete this ingredient? This cannot be undone.")) return
    const prev = ingredients
    setIngredients((p) => p.filter((i) => i.id !== id))

    try {
      await dbDeleteIngredient(id)
    } catch (err) {
      console.error("Failed to delete ingredient:", err)
      setIngredients(prev)
      alert("Failed to delete ingredient. Please try again.")
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 rounded-2xl bg-primary-foreground p-4 elevation-1">
        <header className="flex flex-col gap-2">
          <div className="w-full">
            <h1 className="text-2xl font-medium text-primary whitespace-normal wrap-break-word">Inventory Management</h1>
            <p className="text-sm text-foreground">Overview of restaurant inventory and supplies</p>
          </div>
        </header>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Low Stock Warning</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                {lowStockItems.map((item) => (
                  <li key={item.id}>
                    • {item.name}: {item.quantity} {item.unit} (Minimum: {item.minThreshold} {item.unit})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients Table */}
      <div className="bg-primary-foreground rounded-2xl elevation-1 overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          {/* Tablet/Mobile: grid rows with View more */}
          <div className="lg:hidden">
            <div className="sticky top-0 z-20 grid grid-cols-5 gap-2 bg-muted/60 px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-border">
              <div>Item</div>
              <div className="">Quantity</div>
              <div>Unit</div>
              <div>Status</div>
              <div className="">View</div>
            </div>

            {loading ? (
              <div className="px-4 py-12 text-center text-foreground">Loading…</div>
            ) : ingredients.length === 0 ? (
              <div className="px-4 py-12 text-center text-foreground">No ingredients found</div>
            ) : (
              ingredients.map((ingredient) => {
                const isLow = ingredient.quantity <= ingredient.minThreshold
                const isExpanded = expandedId === ingredient.id
                const isEditing = editingId === ingredient.id

                return (
                  <div
                    key={ingredient.id}
                    className={`border-b last:border-b-0 border-border ${isLow ? "bg-red-50" : "bg-primary-foreground"}`}
                  >
                    <div className="grid grid-cols-5 items-center gap-2 px-4 py-3">
                      <div className="truncate text-foreground">{ingredient.name}</div>
                      <div className="text-foreground">{ingredient.quantity}</div>
                      <div className="truncate text-foreground">{ingredient.unit}</div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isLow ? "bg-red-100 text-error" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isLow ? "Low" : "OK"}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId((prev) => (prev === ingredient.id ? null : ingredient.id))}
                        >
                          {isExpanded ? "Hide" : "More"}
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Min threshold</span>
                            <span className="text-foreground">
                              {ingredient.minThreshold} {ingredient.unit}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="grid grid-cols-1 gap-2">
                              <Input
                                value={String(editForm.name ?? ingredient.name)}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Ingredient name"
                              />
                              <Input
                                type="number"
                                value={String(editForm.quantity ?? ingredient.quantity)}
                                min={0}
                                onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value || 0) })}
                                placeholder="Quantity"
                              />
                              <Input
                                type="number"
                                value={String(editForm.minThreshold ?? ingredient.minThreshold)}
                                min={0}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, minThreshold: Number(e.target.value || 0) })
                                }
                                placeholder="Min threshold"
                              />

                              <div className="flex gap-2">
                                <Button onClick={saveEdit} variant="primary" size="sm" className="flex-1">
                                  <Save className="w-4 h-4" /> Save
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditForm({})
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setEditingId(ingredient.id)
                                  setEditForm(ingredient)
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </Button>
                              <Button
                                onClick={() => deleteIng(ingredient.id)}
                                variant="danger"
                                size="sm"
                                className="flex-1"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: full table */}
          <table className="hidden lg:table w-full">
            <thead>
              <tr className=" border-gray-200 bg-gray-200">
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-secondary border-b border-gray-200">Ingredient</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-secondary border-b border-gray-200">Quantity</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-secondary border-b border-gray-200">Min Threshold</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-left text-sm font-semibold text-secondary border-b border-gray-200">Status</th>
                <th className="sticky top-0 z-20  px-4 py-3 text-center text-sm font-semibold text-secondary border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground">Loading…</td>
                </tr>
              ) : (
                ingredients.map((ingredient) => {
                  const isLow = ingredient.quantity <= ingredient.minThreshold
                  return (
                    <tr
                      key={ingredient.id}
                      className={`border-b border-gray-100 px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition-all ${isLow ? "bg-red-50" : "bg-primary-foreground"}`}
                    >
                      <td className="px-3 py-2  text-gray-500 text-sm">
                        {editingId === ingredient.id ? (
                          <input
                            type="text"
                            value={editForm.name ?? ingredient.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="px-2 py-1 bg-primary-foreground border border-border rounded text-primary text-sm"
                          />
                        ) : (
                          ingredient.name
                        )}
                      </td>
                      <td className="px-3 py-2 text-foreground text-sm">
                        {editingId === ingredient.id ? (
                          <input
                            type="number"
                            value={editForm.quantity ?? ingredient.quantity}
                            min={0}
                            onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value || 0) })}
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-500 w-24 text-sm"
                          />
                        ) : (
                          `${ingredient.quantity} ${ingredient.unit}`
                        )}
                      </td>
                      <td className="px-3 py-2 text-foreground text-sm">
                        {editingId === ingredient.id ? (
                          <input
                            type="number"
                            value={editForm.minThreshold ?? ingredient.minThreshold}
                            min={0}
                            onChange={(e) => setEditForm({ ...editForm, minThreshold: Number(e.target.value || 0) })}
                            className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-500 w-24 text-sm" 
                          />
                        ) : (
                          `${ingredient.minThreshold} ${ingredient.unit}`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isLow ? "bg-red-100 text-error" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-[70px]">
                          {editingId === ingredient.id ? (
                            <>
                              <Button
                                onClick={saveEdit}
                                variant="primary"
                                size="icon"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setEditingId(null)}
                                variant="outline"
                                size="icon"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  setEditingId(ingredient.id)
                                  setEditForm(ingredient)
                                }}
                                variant="outline"
                                size="icon"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => deleteIng(ingredient.id)}
                                variant="danger"
                                size="icon"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}