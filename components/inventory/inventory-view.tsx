"use client"

import { useState } from "react"
import { AlertTriangle, Plus, Edit2, Save, X } from "lucide-react"

interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  minThreshold: number
  lastUpdated: string
}

export default function InventoryView() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "Onion", quantity: 5, unit: "bags", minThreshold: 2, lastUpdated: new Date().toISOString() },
    { id: "2", name: "Chicken", quantity: 10, unit: "kg", minThreshold: 5, lastUpdated: new Date().toISOString() },
    { id: "3", name: "Rice", quantity: 8, unit: "kg", minThreshold: 3, lastUpdated: new Date().toISOString() },
    { id: "4", name: "Oil", quantity: 1, unit: "liter", minThreshold: 2, lastUpdated: new Date().toISOString() },
    { id: "5", name: "Salt", quantity: 2, unit: "kg", minThreshold: 1, lastUpdated: new Date().toISOString() },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({})
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: 0, unit: "kg", minThreshold: 1 })

  const lowStockItems = ingredients.filter((ing) => ing.quantity <= ing.minThreshold)

  const saveEdit = () => {
    if (editingId && editForm.quantity !== undefined) {
      const updated = ingredients.map((ing) =>
        ing.id === editingId ? { ...ing, ...editForm, lastUpdated: new Date().toISOString() } : ing,
      )
      setIngredients(updated)
      localStorage.setItem("ingredients", JSON.stringify(updated))

      // Add to alerts if quantity drops below threshold
      const ingredient = ingredients.find((i) => i.id === editingId)
      if (editForm.quantity && editForm.quantity <= (editForm.minThreshold || ingredient?.minThreshold || 0)) {
        const alerts = JSON.parse(localStorage.getItem("alerts") || "[]")
        if (!alerts.some((a: any) => a.ingredientId === editingId && a.type === "low_stock")) {
          alerts.push({
            id: `ALT-${Date.now()}`,
            ingredientId: editingId,
            ingredientName: ingredient?.name,
            type: "low_stock",
            message: `${ingredient?.name} is running low!`,
            createdAt: new Date().toISOString(),
            resolved: false,
          })
          localStorage.setItem("alerts", JSON.stringify(alerts))
        }
      }

      setEditingId(null)
      setEditForm({})
    }
  }

  const addNewIngredient = () => {
    if (newIngredient.name) {
      const ingredient: Ingredient = {
        id: `ing-${Date.now()}`,
        name: newIngredient.name,
        quantity: newIngredient.quantity,
        unit: newIngredient.unit,
        minThreshold: newIngredient.minThreshold,
        lastUpdated: new Date().toISOString(),
      }
      const updated = [...ingredients, ingredient]
      setIngredients(updated)
      localStorage.setItem("ingredients", JSON.stringify(updated))
      setNewIngredient({ name: "", quantity: 0, unit: "kg", minThreshold: 1 })
      setShowAddForm(false)
    }
  }

  const deleteIngredient = (id: string) => {
    const updated = ingredients.filter((ing) => ing.id !== id)
    setIngredients(updated)
    localStorage.setItem("ingredients", JSON.stringify(updated))
  }

  const getIngredientById = (id: string) => ingredients.find((i) => i.id === id)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all elevation-1 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Ingredient
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl elevation-1">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
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

      {/* Add Form */}
      {showAddForm && (
        <div className="elevation-1 bg-card rounded-xl p-6 mb-6 border-2 border-primary">
          <h2 className="text-xl font-bold text-card-foreground mb-4">Add New Ingredient</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Ingredient name"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              className="px-4 py-2 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newIngredient.quantity}
              onChange={(e) => setNewIngredient({ ...newIngredient, quantity: Number.parseInt(e.target.value) })}
              className="px-4 py-2 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Unit (kg, bags, liters, etc)"
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
              className="px-4 py-2 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Minimum threshold"
              value={newIngredient.minThreshold}
              onChange={(e) => setNewIngredient({ ...newIngredient, minThreshold: Number.parseInt(e.target.value) })}
              className="px-4 py-2 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={addNewIngredient}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold"
            >
              Add Ingredient
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ingredients Table */}
      <div className="elevation-1 bg-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-left font-bold text-card-foreground">Ingredient</th>
                <th className="px-6 py-4 text-left font-bold text-card-foreground">Quantity</th>
                <th className="px-6 py-4 text-left font-bold text-card-foreground">Min Threshold</th>
                <th className="px-6 py-4 text-left font-bold text-card-foreground">Status</th>
                <th className="px-6 py-4 text-center font-bold text-card-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => {
                const isLow = ingredient.quantity <= ingredient.minThreshold
                return (
                  <tr
                    key={ingredient.id}
                    className={`border-b border-border hover:bg-muted/50 transition-all ${isLow ? "bg-yellow-50/50" : ""}`}
                  >
                    <td className="px-6 py-4 font-semibold text-card-foreground">
                      {editingId === ingredient.id ? (
                        <input
                          type="text"
                          value={editForm.name || ingredient.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-2 py-1 bg-input border border-border rounded text-card-foreground"
                        />
                      ) : (
                        ingredient.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-card-foreground">
                      {editingId === ingredient.id ? (
                        <input
                          type="number"
                          value={editForm.quantity ?? ingredient.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: Number.parseInt(e.target.value) })}
                          className="px-2 py-1 bg-input border border-border rounded text-card-foreground w-24"
                        />
                      ) : (
                        `${ingredient.quantity} ${ingredient.unit}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-card-foreground">
                      {editingId === ingredient.id ? (
                        <input
                          type="number"
                          value={editForm.minThreshold ?? ingredient.minThreshold}
                          onChange={(e) => setEditForm({ ...editForm, minThreshold: Number.parseInt(e.target.value) })}
                          className="px-2 py-1 bg-input border border-border rounded text-card-foreground w-24"
                        />
                      ) : (
                        `${ingredient.minThreshold} ${ingredient.unit}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {editingId === ingredient.id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-all"
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
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteIngredient(ingredient.id)}
                              className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
