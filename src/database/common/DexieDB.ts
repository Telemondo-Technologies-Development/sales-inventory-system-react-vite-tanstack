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

/**
 * Expense type is exported here so components can import the type-only symbol
 * from the centralized Dexie DB module.
 */
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
export function normalizeName(s?: string) {
  if (!s) return ""
  return s
    .toLowerCase()
    .replace(/\b(kg|g|gram|grams|bag|bags|pc|pcs|piece|pieces|liter|litre|l|x)\b/g, "")
    .replace(/[\d\.,\-\/\(\)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}