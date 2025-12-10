

import React, { useEffect, useState } from "react"
import { AlertTriangle, Plus, Edit2, Save, X, Trash2 } from "lucide-react"
import {
  getIngredients,
  updateIngredient as dbUpdateIngredient,
  deleteIngredient as dbDeleteIngredient,
} from "../database/inventory-helper/InventoryDexieDB"
import ExpenseModal from "../components/inventory-system/InventoryDetails"

import type { Ingredient } from "../database/inventory-helper/InventoryDexieDB"


export default function InventoryView() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({})
  const [loading, setLoading] = useState(true)
  
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
    <div className="p-8">
      <div className="flex flex-col items-start mb-6 bg-primary-foreground rounded-2xl p-2 elevation-1 border border-gray-200">
        <h1 className="text-3xl font-medium text-primary">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Overview of restaurant inventory and supplies</p>

      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-0.5" />
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
      <div className="bg-primary-foreground rounded-2xl overflow-hidden elevation-1 border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                              <button
                                onClick={saveEdit}
                                className="p-2 bg-tertiary text-white rounded-lg hover:bg-tertiary/90 shadow-sm transition"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 shadow-sm transition"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(ingredient.id)
                                  setEditForm(ingredient)
                                }}
                                className="px-3 py-1 bg-primary-foreground border rounded text-sm text-secondary hover:shadow-sm"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteIng(ingredient.id)}
                                className="px-3 py-1 bg-primary-foreground border rounded text-sm text-error hover:shadow-sm"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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