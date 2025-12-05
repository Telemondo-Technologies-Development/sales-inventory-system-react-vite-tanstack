import { db } from "../common/DexieDB"
import type { Expense } from "../common/DexieDB"
import { findMatchingIngredient, addIngredient, updateIngredient } from "../inventory-helper/InventoryDexieDB"

/**
 * addExpense:
 *  - adds an expense record
 *  - tries to find an existing ingredient by normalized name
 *    - if found: increases its quantity by expense.quantity and updates lastUpdated
 *    - if not found: creates a new ingredient entry using expense.item as name
 *  - returns the saved expense object
 */
export const addExpense = async (expense: Expense): Promise<Expense> => {
  const now = new Date().toISOString()
  await db.expenses.add(expense)

  const match = await findMatchingIngredient(expense.item)

  if (match) {
    const newQty = Number(match.quantity || 0) + Number(expense.quantity || 0)
    await updateIngredient(match.id, { quantity: newQty, lastUpdated: now })
  } else {
    const newIng = {
      id: `ing-${Date.now()}`,
      name: expense.item,
      quantity: Number(expense.quantity || 0),
      unit: expense.unit || "unit",
      minThreshold: 1,
      lastUpdated: now,
    }
    try {
      await addIngredient(newIng as any)
    } catch (err) {
      console.warn("Failed to create ingredient for expense:", err)
    }
  }

  return expense
}

export const getExpenses = async (): Promise<Expense[]> => db.expenses.orderBy("date").reverse().toArray()
export const deleteExpense = async (id: string) => db.expenses.delete(id)
export const updateExpense = async (expense: Expense) => {
  await db.expenses.put(expense)
  // Caller may reload ingredients if needed after edits.
}

/**
 * Optional helper: reconcile inventory when editing an expense.
 * (kept for parity with original file; use carefully)
 */
export async function reconcileExpenseEdit(oldExp: Expense, newExp: Expense) {
  const now = new Date().toISOString()

  // subtract old
  const oldMatch = await findMatchingIngredient(oldExp.item)
  if (oldMatch) {
    const newQty = Math.max(0, Number(oldMatch.quantity || 0) - Number(oldExp.quantity || 0))
    await updateIngredient(oldMatch.id, { quantity: newQty, lastUpdated: now })
  }

  // add new
  const newMatch = await findMatchingIngredient(newExp.item)
  if (newMatch) {
    const newQty = Number(newMatch.quantity || 0) + Number(newExp.quantity || 0)
    await updateIngredient(newMatch.id, { quantity: newQty, lastUpdated: now })
  } else {
    await addIngredient({
      id: `ing-${Date.now()}`,
      name: newExp.item,
      quantity: Number(newExp.quantity || 0),
      unit: newExp.unit || "unit",
      minThreshold: 1,
      lastUpdated: now,
    } as any)
  }

  await updateExpense(newExp)
}