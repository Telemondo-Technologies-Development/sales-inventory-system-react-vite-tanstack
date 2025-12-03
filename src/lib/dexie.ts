import Dexie from "dexie"

/* ---- Types ---- */
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

export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  minThreshold: number
  lastUpdated: string
}

export interface Expense {
  id: string
  item: string // e.g. "Flour - 25kg bag"
  quantity: number // number of units (e.g. 1 bag)
  unit: string // e.g. "bag"
  unitWeight?: string // "25kg"
  cost: number // total cost
  supplier?: string
  date: string
  notes?: string
}

/* ---- Dexie DB ---- */
class AppDB extends Dexie {
  orders!: Dexie.Table<Order, string>
  ingredients!: Dexie.Table<Ingredient, string>
  menuItems!: Dexie.Table<{ id: string; name: string; price: number; category: string; image?: string }, string>
  expenses!: Dexie.Table<Expense, string>

  constructor() {
    super("myapp-db")
    this.version(2).stores({
      orders: "id, tableNumber, status, createdAt",
      ingredients: "id, name",
      menuItems: "id, name, category",
      expenses: "id, item, supplier, date",
    })

    this.orders = this.table("orders")
    this.ingredients = this.table("ingredients")
    this.menuItems = this.table("menuItems")
    this.expenses = this.table("expenses")
  }
}

export const db = new AppDB()

/* ---------- Utility: normalize product name for matching ---------- */
function normalizeName(s?: string) {
  if (!s) return ""
  return s
    .toLowerCase()
    .replace(/\b(kg|g|gram|grams|bag|bags|pc|pcs|piece|pieces|liter|litre|l|x)\b/g, "")
    .replace(/[\d\.,\-\/\(\)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/* ---------- Orders helpers ---------- */
export const getOrders = async (): Promise<Order[]> => db.orders.orderBy("createdAt").reverse().toArray()
export const addOrder = async (order: Order) => db.orders.add(order)
export const updateOrder = async (order: Order) => db.orders.put(order)
export const updateOrderStatus = async (orderId: string, status: Order["status"]) =>
  db.orders.update(orderId, { status })
export const deleteOrder = async (orderId: string) => db.orders.delete(orderId)
export const addPaymentRecord = async (orderId: string, payment: PaymentRecord) => {
  const order = await db.orders.get(orderId)
  if (!order) throw new Error("Order not found")
  order.paymentRecords = [...(order.paymentRecords || []), payment]
  await db.orders.put(order)
}

/* ---------- Ingredients helpers ---------- */
export const getIngredients = async (): Promise<Ingredient[]> => db.ingredients.orderBy("name").toArray()
export const addIngredient = async (ingredient: Ingredient) => db.ingredients.add(ingredient)
export const updateIngredient = async (id: string, patch: Partial<Ingredient>) => {
  const now = new Date().toISOString()
  await db.ingredients.update(id, { ...patch, lastUpdated: now })
}
export const deleteIngredient = async (id: string) => db.ingredients.delete(id)

/* ---------- Expenses helpers ---------- */
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

  const expenseNameNorm = normalizeName(expense.item)
  const allIngredients = await db.ingredients.toArray()
  const match = allIngredients.find((ing) => {
    const ingNorm = normalizeName(ing.name)
    return ingNorm === expenseNameNorm || ingNorm.includes(expenseNameNorm) || expenseNameNorm.includes(ingNorm)
  })

  if (match) {
    const newQty = Number(match.quantity || 0) + Number(expense.quantity || 0)
    await db.ingredients.update(match.id, { quantity: newQty, lastUpdated: now })
  } else {
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: expense.item,
      quantity: Number(expense.quantity || 0),
      unit: expense.unit || "unit",
      minThreshold: 1,
      lastUpdated: now,
    }
    try {
      await db.ingredients.add(newIng)
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

/* ---------- Seed helper (migrate from localStorage if present) ---------- */
const SEED_FLAG = "myapp-seeded-v1"

export async function seedFromLocalStorageIfEmpty() {
  if (typeof window === "undefined") return

  // Do not attempt to reseed repeatedly
  if (localStorage.getItem(SEED_FLAG)) return

  const ingCount = await db.ingredients.count()
  const orderCount = await db.orders.count()
  const expenseCount = await db.expenses.count()

  let seededSomething = false

  try {
    const rawIngredients = JSON.parse(localStorage.getItem("ingredients") || "null")
    if (Array.isArray(rawIngredients) && rawIngredients.length && ingCount === 0) {
      await db.transaction("rw", db.ingredients, async () => {
        for (const ing of rawIngredients) {
          const i: Ingredient = {
            id: ing.id || `ing-${Date.now()}`,
            name: ing.name || "Unknown",
            quantity: Number(ing.quantity ?? 0),
            unit: ing.unit || "unit",
            minThreshold: Number(ing.minThreshold ?? 1),
            lastUpdated: ing.lastUpdated || new Date().toISOString(),
          }
          await db.ingredients.add(i)
        }
      })
      console.info("Seeded ingredients into Dexie from localStorage.")
      seededSomething = true
    }

    const rawOrders = JSON.parse(localStorage.getItem("orders") || "null")
    if (Array.isArray(rawOrders) && rawOrders.length && orderCount === 0) {
      await db.transaction("rw", db.orders, async () => {
        for (const o of rawOrders) {
          if (!o.id) o.id = `ORD-${Date.now()}`
          if (!o.paymentRecords) o.paymentRecords = []
          await db.orders.add(o)
        }
      })
      console.info("Seeded orders into Dexie from localStorage.")
      seededSomething = true
    }

    const rawExpenses = JSON.parse(localStorage.getItem("expenses") || "null")
    if (Array.isArray(rawExpenses) && rawExpenses.length && expenseCount === 0) {
      await db.transaction("rw", db.expenses, async () => {
        for (const e of rawExpenses) {
          const ex: Expense = {
            id: e.id || `exp-${Date.now()}`,
            item: e.item || "Unknown",
            quantity: Number(e.quantity || 0),
            unit: e.unit || "unit",
            unitWeight: e.unitWeight,
            cost: Number(e.cost || 0),
            supplier: e.supplier,
            date: e.date || new Date().toISOString(),
            notes: e.notes,
          }
          await db.expenses.add(ex)
          try {
            // also update ingredients for this expense
            await addExpense(ex)
          } catch {}
        }
      })
      console.info("Seeded expenses into Dexie from localStorage.")
      seededSomething = true
    }

    // If we seeded any data successfully, mark as seeded and REMOVE the old localStorage keys
    if (seededSomething) {
      try {
        localStorage.setItem(SEED_FLAG, "true")
        // Remove legacy localStorage backups so they don't restore later
        localStorage.removeItem("ingredients")
        localStorage.removeItem("orders")
        localStorage.removeItem("expenses")
        console.info("Removed legacy localStorage backups after seeding.")
      } catch (err) {
        console.warn("Failed to clean up localStorage after seeding:", err)
      }
    }
  } catch (err) {
    console.warn("Seeding from localStorage failed:", err)
  }
}